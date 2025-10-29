import express from "express";
import Admin from "../models/Admin.js";
import Order from "../models/Order.js";
import Expense from "../models/Expense.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Create admin manually (use once)
router.post("/create", async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: "Admin already exists" });

    const admin = new Admin({ email, password });
    await admin.save();
    res.status(201).json({ message: "Admin created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id }, "your_jwt_secret", { expiresIn: "1d" });
    res.json({ token, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get comprehensive dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const [users, products, categories, orders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments()
    ]);

    res.json({
      success: true,
      stats: { users, products, categories, orders }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get report data for admin reports page
router.get("/reports", async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);
    
    // Get current week number
    const startOfYearDay = new Date(currentYear, 0, 1);
    const pastDaysOfYear = (now - startOfYearDay) / 86400000;
    const currentWeek = Math.ceil((pastDaysOfYear + startOfYearDay.getDay() + 1) / 7);
    
    // Basic stats
    const [totalOrders, totalUsers, totalProducts, totalCategories] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments()
    ]);

    // Sales data
    const [totalSales, monthlySales, weeklySales] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, 
            orderStatus: { $ne: 'cancelled' } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    // Recent orders activity - using lean query without populate due to schema mismatch
    const recentOrders = await Order.find({}, {
      orderNumber: 1,
      orderId: 1,
      totalAmount: 1,
      orderStatus: 1,
      paymentStatus: 1,
      shippingAddress: 1,
      createdAt: 1
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Monthly sales trend (last 12 months)
    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear - 1, now.getMonth(), 1) },
          orderStatus: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Expenses data
    const [monthlyExpenses, weeklyExpenses, expensesByCategory] = await Promise.all([
      Expense.aggregate([
        { $match: { year: currentYear, month: currentMonth } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { year: currentYear, week: currentWeek } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.getTotalByCategory(startOfMonth, endOfMonth)
    ]);

    // Calculate profits
    const monthlyRevenue = monthlySales[0]?.total || 0;
    const weeklyRevenue = weeklySales[0]?.total || 0;
    const monthlyExpenseTotal = monthlyExpenses[0]?.total || 0;
    const weeklyExpenseTotal = weeklyExpenses[0]?.total || 0;
    
    const monthlyProfit = monthlyRevenue - monthlyExpenseTotal;
    const weeklyProfit = weeklyRevenue - weeklyExpenseTotal;

    res.json({
      success: true,
      data: {
        overview: {
          totalSales: totalSales[0]?.total || 0,
          totalOrders: totalSales[0]?.count || 0,
          totalUsers,
          totalProducts,
          totalCategories
        },
        currentPeriod: {
          monthly: {
            sales: monthlyRevenue,
            orders: monthlySales[0]?.count || 0,
            expenses: monthlyExpenseTotal,
            profit: monthlyProfit
          },
          weekly: {
            sales: weeklyRevenue,
            orders: weeklySales[0]?.count || 0,
            expenses: weeklyExpenseTotal,
            profit: weeklyProfit
          }
        },
        recentOrders,
        salesTrend,
        expensesByCategory
      }
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add/Update expense
router.post("/expenses", async (req, res) => {
  try {
    const { title, description, amount, category, type, frequency } = req.body;
    
    // For this demo, we'll use a default admin ID
    // In production, get this from auth middleware
    const adminId = req.user?.id || '507f1f77bcf86cd799439011'; // Default ObjectId
    
    const expense = new Expense({
      title,
      description,
      amount,
      category,
      type,
      frequency,
      createdBy: adminId
    });
    
    await expense.save();
    
    res.json({
      success: true,
      expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expenses by period
router.get("/expenses/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const { year = new Date().getFullYear(), value } = req.query;
    
    let expenses;
    
    if (period === 'weekly' && value) {
      expenses = await Expense.getByPeriod('weekly', parseInt(value), parseInt(year));
    } else if (period === 'monthly' && value) {
      expenses = await Expense.getByPeriod('monthly', parseInt(value), parseInt(year));
    } else {
      // Get all expenses for the year
      expenses = await Expense.find({ year: parseInt(year) }).sort({ date: -1 });
    }
    
    res.json({
      success: true,
      expenses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get filtered orders by date, week, month, or year
router.get("/orders/filter", async (req, res) => {
  try {
    const { filterType, date, week, month, year } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (filterType) {
      case 'date':
        if (date) {
          const selectedDate = new Date(date);
          const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
          const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
          dateFilter = {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          };
        }
        break;
        
      case 'week':
        if (week && year) {
          // Calculate start and end of the specified week
          const yearInt = parseInt(year);
          const weekInt = parseInt(week);
          const startOfYear = new Date(yearInt, 0, 1);
          const daysToAdd = (weekInt - 1) * 7;
          const startOfWeek = new Date(startOfYear.setDate(startOfYear.getDate() + daysToAdd - startOfYear.getDay()));
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          dateFilter = {
            createdAt: { $gte: startOfWeek, $lte: endOfWeek }
          };
        } else {
          // Current week
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          dateFilter = {
            createdAt: { $gte: startOfWeek, $lte: endOfWeek }
          };
        }
        break;
        
      case 'month':
        if (month && year) {
          const yearInt = parseInt(year);
          const monthInt = parseInt(month) - 1; // Month is 0-indexed in JS
          const startOfMonth = new Date(yearInt, monthInt, 1);
          const endOfMonth = new Date(yearInt, monthInt + 1, 0, 23, 59, 59, 999);
          
          dateFilter = {
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          };
        } else {
          // Current month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          
          dateFilter = {
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          };
        }
        break;
        
      case 'year':
        if (year) {
          const yearInt = parseInt(year);
          const startOfYear = new Date(yearInt, 0, 1);
          const endOfYear = new Date(yearInt, 11, 31, 23, 59, 59, 999);
          
          dateFilter = {
            createdAt: { $gte: startOfYear, $lte: endOfYear }
          };
        } else {
          // Current year
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          
          dateFilter = {
            createdAt: { $gte: startOfYear, $lte: endOfYear }
          };
        }
        break;
        
      default:
        // No filter - return all orders
        break;
    }
    
    const orders = await Order.find(dateFilter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      orders,
      count: orders.length,
      filter: { filterType, date, week, month, year }
    });
  } catch (error) {
    console.error('Orders filter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
