import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import categoryRoutes from "../backend/Routes/category.js";
// import productRoutes from "../backend/Routes/products.js";
import Product from "../backend/models/Products.js";
import Cart from "../backend/models/Cart.js";
import Wishlist from "../backend/models/Wishlist.js";
import authMiddleware from "../backend/middleware/auth.js"; // Assuming you have an auth middleware
// import Category from "../backend/models/Category.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Configure CORS properly for credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
// app.use("/api/categories", categoryRoutes);
// In your Express app (Node.js backend)
app.use('/uploads', express.static('uploads'));

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ✅ serve uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api/products", productRoutes);

// Serve frontend build if present
const frontendDir = path.join(__dirname, 'dist');
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
}

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

// ======================== DB CONNECTION ========================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// ======================== MODELS ========================

// --- User Model ---
// Update your existing userSchema to include Google fields
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    role: { type: String, enum: ['customer', 'admin', 'super_admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
    // ✅ Add these Google OAuth fields
    googleId: { type: String, unique: true, sparse: true }, // Google's unique user ID
    avatar: { type: String }, // Profile picture URL from Google
    provider: { type: String, enum: ['local', 'google'], default: 'local' }, // How user registered
    isEmailVerified: { type: Boolean, default: false } // Google users are auto-verified
  },
  { timestamps: true }
);


// Create User model
const User = mongoose.model("User", userSchema);

// --- Category Model ---
const categorySchema = new mongoose.Schema(
  {
    categoryname: { type: String, required: true },
    image: { type: String, required: false },
  },
  { timestamps: true }
);
const Category = mongoose.model("Category", categorySchema);

// --- Admin Model ---
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
  },
  { timestamps: true }
);

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

// ======================== MIDDLEWARE ========================
const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer TOKEN
  if (!token) {
    console.log('❌ No token provided for admin route');
    return res.status(401).json({ message: "Not authorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 Decoded token:', { id: decoded.id, isAdmin: decoded.isAdmin });
    
    if (!decoded.isAdmin) {
      console.log('❌ Token does not have admin privileges');
      return res.status(401).json({ message: "Not authorized - Admin access required" });
    }
    
    req.adminId = decoded.id;
    console.log('✅ Admin verified:', decoded.id);
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ message: "Token is invalid or expired" });
  }
};

// ===================== MULTER SETUP =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    // Sanitize filename by removing spaces and special characters
    const sanitizedName = file.originalname
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters except dots, underscores, hyphens
      .toLowerCase(); // Convert to lowercase for consistency
    cb(null, Date.now() + "-" + sanitizedName);
  },
});
const upload = multer({ storage });

// ======================== ROUTES ========================
// Import ShafesChannel models
import Post from "./models/Post.js";
import Subscription from "./models/Subscription.js";
// Import Expense model
import Expense from "./models/Expense.js";


// ==================== ADMIN ROUTES ====================

// Get comprehensive dashboard stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [users, products, categories, orders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      mongoose.model('Order') ? mongoose.model('Order').countDocuments() : 0
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
app.get('/api/admin/reports', async (req, res) => {
  try {
    console.log('📊 Reports endpoint called');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);
    
    // Calculate current week
    const startOfYearDay = new Date(currentYear, 0, 1);
    const pastDaysOfYear = (now - startOfYearDay) / 86400000;
    const currentWeek = Math.ceil((pastDaysOfYear + startOfYearDay.getDay() + 1) / 7);
    
    // Get basic stats
    const totalUsers = await User.countDocuments().catch(() => 0);
    const totalProducts = await Product.countDocuments().catch(() => 0);
    const totalCategories = await Category.countDocuments().catch(() => 0);
    
    // Try to get Order model
    let Order;
    let orderStats = {
      totalSales: 0,
      totalOrders: 0,
      monthlySales: 0,
      monthlyOrders: 0,
      weeklySales: 0,
      weeklyOrders: 0,
      topProducts: [],
      salesTrend: [],
      recentOrders: []
    };
    
    try {
      Order = mongoose.model('Order');
      
      // Get order statistics
      const [totalSales, monthlySales, weeklySales] = await Promise.all([
        Order.aggregate([
          { $match: { orderStatus: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]).catch(() => []),
        Order.aggregate([
          { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, orderStatus: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]).catch(() => []),
        Order.aggregate([
          { 
            $match: { 
              createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, 
              orderStatus: { $ne: 'cancelled' } 
            } 
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]).catch(() => [])
      ]);
      
      orderStats.totalSales = totalSales[0]?.total || 0;
      orderStats.totalOrders = totalSales[0]?.count || 0;
      orderStats.monthlySales = monthlySales[0]?.total || 0;
      orderStats.monthlyOrders = monthlySales[0]?.count || 0;
      orderStats.weeklySales = weeklySales[0]?.total || 0;
      orderStats.weeklyOrders = weeklySales[0]?.count || 0;
      
      // Get top products
      orderStats.topProducts = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]).catch(() => []);
      
      // Get sales trend
      orderStats.salesTrend = await Order.aggregate([
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
      ]).catch(() => []);
      
      // Get recent orders (last 10)
      orderStats.recentOrders = await Order.find({})
        .select('orderNumber orderId totalAmount orderStatus paymentStatus shippingAddress createdAt user')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .catch((err) => {
          console.warn('⚠️ Failed to fetch recent orders:', err.message);
          return [];
        });
      
      console.log('📦 Recent orders fetched:', orderStats.recentOrders.length);
      
    } catch (err) {
      console.warn('Order model not available, using default values');
    }
    
    // Get REAL expense data from database
    let monthlyExpenseTotal = 0;
    let weeklyExpenseTotal = 0;
    let expensesByCategory = [];
    
    try {
      const [monthlyExpenses, weeklyExpenses, expensesByCat] = await Promise.all([
        Expense.aggregate([
          { $match: { year: currentYear, month: currentMonth } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).catch(() => []),
        Expense.aggregate([
          { $match: { year: currentYear, week: currentWeek } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).catch(() => []),
        Expense.getTotalByCategory(startOfMonth, endOfMonth).catch(() => [])
      ]);
      
      monthlyExpenseTotal = monthlyExpenses[0]?.total || 0;
      weeklyExpenseTotal = weeklyExpenses[0]?.total || 0;
      expensesByCategory = expensesByCat || [];
      
      console.log('📊 Expense data:', { monthlyExpenseTotal, weeklyExpenseTotal, categoriesCount: expensesByCategory.length });
    } catch (error) {
      console.warn('⚠️ Expense queries failed:', error.message);
    }
    
    // Calculate profits
    const monthlyProfit = orderStats.monthlySales - monthlyExpenseTotal;
    const weeklyProfit = orderStats.weeklySales - weeklyExpenseTotal;
    
    const responseData = {
      success: true,
      data: {
        overview: {
          totalSales: orderStats.totalSales,
          totalOrders: orderStats.totalOrders,
          totalUsers,
          totalProducts,
          totalCategories
        },
        currentPeriod: {
          monthly: {
            sales: orderStats.monthlySales,
            orders: orderStats.monthlyOrders,
            expenses: monthlyExpenseTotal,
            profit: monthlyProfit
          },
          weekly: {
            sales: orderStats.weeklySales,
            orders: orderStats.weeklyOrders,
            expenses: weeklyExpenseTotal,
            profit: weeklyProfit
          }
        },
        recentOrders: orderStats.recentOrders,
        topProducts: orderStats.topProducts,
        salesTrend: orderStats.salesTrend,
        expensesByCategory
      }
    };
    
    console.log('✅ Reports data prepared with REAL expenses');
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add/Update expense - SAVE TO DATABASE
app.post('/api/admin/expenses', async (req, res) => {
  try {
    const { title, description, amount, category, type, frequency } = req.body;
    
    console.log('💰 Creating expense:', { title, amount, category });
    
    // Use a valid default admin ID
    const adminId = req.user?.id || new mongoose.Types.ObjectId();
    
    const expense = new Expense({
      title,
      description,
      amount: parseFloat(amount),
      category,
      type,
      frequency,
      createdBy: adminId
    });
    
    await expense.save();
    
    console.log('✅ Expense saved successfully:', expense._id);
    
    res.json({
      success: true,
      expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    console.error('❌ Add expense error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expenses by period - FETCH FROM DATABASE
app.get('/api/admin/expenses/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { year = new Date().getFullYear(), value } = req.query;
    
    console.log('📊 Fetching expenses for period:', { period, year, value });
    
    let expenses;
    
    if (period === 'weekly' && value) {
      expenses = await Expense.getByPeriod('weekly', parseInt(value), parseInt(year));
    } else if (period === 'monthly' && value) {
      expenses = await Expense.getByPeriod('monthly', parseInt(value), parseInt(year));
    } else if (period === 'all') {
      // Get all expenses for the current year
      expenses = await Expense.find({ year: parseInt(year) }).sort({ date: -1 });
    } else {
      // Get all expenses
      expenses = await Expense.find({}).sort({ date: -1 }).limit(100);
    }
    
    console.log('✅ Found', expenses.length, 'expenses');
    
    res.json({
      success: true,
      expenses
    });
  } catch (error) {
    console.error('❌ Get expenses error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get filtered orders by date, week, month, or year
app.get('/api/admin/orders/filter', async (req, res) => {
  try {
    const { filterType, date, week, month, year } = req.query;
    console.log('🔍 Filtering orders:', { filterType, date, week, month, year });
    
    let Order;
    try {
      Order = mongoose.model('Order');
    } catch (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Order model not found',
        error: err.message 
      });
    }
    
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
    
    console.log(`✅ Found ${orders.length} orders with filter`);
    
    res.json({
      success: true,
      orders,
      count: orders.length,
      filter: { filterType, date, week, month, year }
    });
  } catch (error) {
    console.error('❌ Orders filter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public: Top bought products for homepage
app.get('/api/products/top-bought', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 24);

    const top = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      // Exclude custom design entries from count
      { $match: { $or: [ { 'items.isCustomDesign': { $ne: true } }, { 'items.product': { $exists: true } } ] } },
      { $addFields: { prodKey: { $ifNull: ['$items.product', '$items.productId'] } } },
      {
        $group: {
          _id: '$prodKey',
          totalSold: { $sum: '$items.quantity' },
          lastOrderAt: { $max: '$createdAt' },
          nameFromOrder: { $last: '$items.name' },
          imageFromOrder: { $last: '$items.image' },
          priceFromOrder: { $last: '$items.price' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          totalSold: 1,
          lastOrderAt: 1,
          name: { $ifNull: ['$product.name', '$nameFromOrder'] },
          image: { $ifNull: ['$product.image', '$imageFromOrder'] },
          price: { $ifNull: ['$product.price', '$priceFromOrder'] },
          category: '$product.category',
          stock: '$product.stock',
          description: '$product.description'
        }
      }
    ]);

    res.json({ success: true, products: top });
  } catch (error) {
    console.error('❌ Top-bought error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHAFESCHANNEL ROUTES ====================

// Generate JWT token
const generateToken = (id, isAdmin = false, expiresIn = '7d') => {
  return jwt.sign({ id, isAdmin }, JWT_SECRET, { expiresIn });
};

// User authentication middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ShafesChannel User signup
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    // Create free subscription
    await Subscription.create({
      userId: user._id,
      subscriptionType: 'free'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ShafesChannel User login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id, true);

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ShafesChannel API is running!',
    timestamp: new Date().toISOString()
  });
});

// ==================== SUBSCRIPTION ROUTES ====================

// Get user subscription status (with token)
app.get('/api/subscription/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const subscription = await Subscription.findOne({ userId: userId });

    if (!subscription) {
      return res.json({
        success: true,
        subscribed: false,
        subscription: null
      });
    }

    res.json({
      success: true,
      subscribed: subscription.status === 'active',
      subscription: {
        type: subscription.subscriptionType,
        status: subscription.status,
        subscriptionDate: subscription.subscriptionDate,
        expiryDate: subscription.expiryDate
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription status'
    });
  }
});

// Get user subscription status by userId (legacy route)
app.get('/api/subscription/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let subscription = await Subscription.findOne({ userId: userId });
    
    if (!subscription) {
      // Create free subscription if none exists
      subscription = await Subscription.create({
        userId: userId,
        subscriptionType: 'free'
      });
    }
    
    res.json({
      success: true,
      subscription: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Subscribe user to a plan
app.post('/api/subscribe', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    let subscription = await Subscription.findOne({ userId: userId });
    
    if (subscription) {
      if (subscription.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'You are already subscribed'
        });
      } else {
        // Reactivate subscription
        subscription.status = 'active';
        subscription.subscriptionDate = new Date();
        await subscription.save();
      }
    } else {
      // Create new free subscription
      subscription = await Subscription.create({
        userId: userId,
        subscriptionType: 'free',
        status: 'active'
      });
    }
    
    res.json({
      success: true,
      message: 'Subscribed successfully',
      subscription: {
        type: subscription.subscriptionType,
        status: subscription.status,
        subscriptionDate: subscription.subscriptionDate
      }
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ADMIN POSTS ROUTES ====================

// Get all posts (Admin)
app.get('/api/admin/posts', verifyAdmin, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      posts: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new post (Admin)
app.post('/api/admin/posts', verifyAdmin, upload.fields([{ name: 'thumbnail' }, { name: 'content' }]), async (req, res) => {
  try {
    const { title, description, type, category, tags, isPublished } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }
    
    const postData = {
      title,
      description,
      type: type || 'article',
      category: category || 'Behind the Scenes',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublished: isPublished === 'true',
      author: req.adminId,
      adminId: req.adminId, // For backwards compatibility
      views: 0,
      likes: [],
      comments: []
    };
    
    // Add file paths if files were uploaded
    if (req.files) {
      if (req.files.thumbnail) {
        postData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.content) {
        postData.content = `/uploads/${req.files.content[0].filename}`;
      }
    }
    
    const post = await Post.create(postData);
    
    res.json({
      success: true,
      message: 'Post created successfully',
      post: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete post (Admin)
app.delete('/api/admin/posts/:id', verifyAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get post with comments (Admin)
app.get('/api/admin/posts/:id/comments', verifyAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments.userId', 'name email')
      .populate('author', 'name email');
      
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      post: {
        _id: post._id,
        title: post.title,
        description: post.description,
        views: post.views,
        likes: post.likes.length,
        comments: post.comments
      }
    });
  } catch (error) {
    console.error('Error fetching post comments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin reply to comment
app.post('/api/admin/posts/:id/comments/:commentId/reply', verifyAdmin, async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    // Add reply to comment (we'll store replies as a nested array)
    if (!comment.replies) {
      comment.replies = [];
    }
    
    comment.replies.push({
      content: content.trim(),
      isAdmin: true,
      adminId: req.adminId,
      createdAt: new Date()
    });
    
    await post.save();
    
    // Get updated post with populated data
    const updatedPost = await Post.findById(postId)
      .populate('comments.userId', 'name email');
    
    res.json({
      success: true,
      message: 'Reply added successfully',
      comment: updatedPost.comments.id(commentId)
    });
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get public posts (for frontend)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .populate('author', 'name email')
      .populate('comments.userId', 'name email');
    res.json({
      success: true,
      posts: posts
    });
  } catch (error) {
    console.error('Error fetching public posts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email')
      .populate('comments.userId', 'name email');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json({
      success: true,
      post: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Like/Unlike a post
app.post('/api/posts/:id/like', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const existingLike = post.likes.find(like => like.userId.toString() === userId.toString());
    
    if (existingLike) {
      // Unlike - remove the like
      post.likes = post.likes.filter(like => like.userId.toString() !== userId.toString());
    } else {
      // Like - add the like
      post.likes.push({ userId });
    }
    
    await post.save();
    
    res.json({
      success: true,
      liked: !existingLike,
      likeCount: post.likes.length
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add comment to a post
app.post('/api/posts/:id/comment', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const newComment = {
      userId,
      content: content.trim(),
      createdAt: new Date()
    };
    
    post.comments.push(newComment);
    await post.save();
    
    // Get the populated comment
    const savedPost = await Post.findById(postId)
      .populate('comments.userId', 'name email');
    const addedComment = savedPost.comments[savedPost.comments.length - 1];
    
    res.json({
      success: true,
      comment: addedComment,
      commentCount: post.comments.length
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this import at the top with your other imports


// Add this after your JWT_SECRET declaration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your_google_client_id_here";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Add this route after your existing /login route
// ✅ Google OAuth Route - Add this to your server.js
app.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    console.log('🔐 Google OAuth request received');

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required"
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified
    } = payload;

    console.log('✅ Google token verified:', { email, name, googleId });

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified"
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google info if needed
      console.log('👤 Existing user found:', user.email);
      
      // Update user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = avatar;
        await user.save();
        console.log('✅ Updated existing user with Google info');
      }
    } else {
      // Create new user from Google info
      console.log('🆕 Creating new user from Google auth');
      
      user = await User.create({
        email,
        name,
        googleId,
        avatar,
        // Set a random password since they're using Google OAuth
        password: await bcrypt.hash(Math.random().toString(36), 10),
        // Set default values for other fields
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "India"
      });
      
      console.log('✅ New Google user created:', user.email);
    }

    // Generate JWT token (same as regular login)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    // Return user info and token (same format as regular login)
    res.json({
      success: true,
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        avatar: user.avatar,
        role: "user" // Google users are regular users
      },
      token
    });

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({
        success: false,
        message: "Invalid token timing"
      });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
      error: error.message
    });
  }
});

// --- User Routes ---
app.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, address, city, state, country } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      address,
      city,
      state,
      country,
    });

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- User Login Route ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// middleware (you already have verifyAdmin, add verifyUser)
const verifyUser = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Get profile
app.get("/api/profile", verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    // Return user data directly (not wrapped in 'user' property)
    // This matches what the frontend expects
    const userData = {
      id: user._id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || ''
    };
    
    res.json(userData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update profile
app.put("/api/profile", verifyUser, async (req, res) => {
  try {
    const { name, phone, address, city, state, country } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, address, city, state, country },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});





// ✅ Enhanced error handling middleware
const handleCartError = (error, res) => {
  console.error("Cart operation error:", error);
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ 
      message: "Validation failed", 
      errors: errors 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      message: "Invalid ID format" 
    });
  }
  
  return res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
  });
};

// ✅ Get cart - with enhanced error handling
app.get("/api/cart", verifyUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }
    
    // Process items to ensure consistent structure
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId || item._id.toString(),
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          // Flatten custom design data for easier frontend access
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          customPhoto: item.customPhoto,
          customPhotos: item.customPhotos || [],
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    res.json({ items: processedItems });
  } catch (err) {
    handleCartError(err, res);
  }
});



// ✅ Fixed Add to cart route
app.post("/api/cart/add", verifyUser, async (req, res) => {
  try {
    const { productId, quantity = 1, specialRequest = "", customDesign, customPhoto, customPhotos } = req.body;
    console.log("➕ Cart add request:", { 
      productId, 
      quantity, 
      hasCustomDesign: !!customDesign, 
      hasCustomPhoto: !!customPhoto, 
      hasCustomPhotos: !!(customPhotos && customPhotos.length > 0),
      photosCount: customPhotos?.length || 0,
      userId: req.userId 
    });
    
    // 🔍 DEBUG: Log detailed photo data with validation
    if (customPhoto) {
      console.log("📷 Single customPhoto received:", {
        hasFilePath: !!customPhoto.filePath,
        hasImage: !!customPhoto.image,
        filePath: customPhoto.filePath,
        imageTruncated: customPhoto.image ? customPhoto.image.substring(0, 50) + '...' : null,
        name: customPhoto.name,
        size: customPhoto.size,
        type: customPhoto.type || customPhoto.mimeType
      });
      
      // Validate photo data
      if (!customPhoto.filePath && !customPhoto.image) {
        return res.status(400).json({
          success: false,
          message: "Photo data is incomplete. Either filePath or image data is required."
        });
      }
      
      // If filePath exists, verify file exists on disk
      if (customPhoto.filePath) {
        // fs is already imported at the top
        const fullPath = `C:\\Users\\ADMIN\\Desktop\\mwtproject (3)current\\mwtproject (3)fe\\mwtproject\\mwtc\\mwtc12\\backend${customPhoto.filePath}`;
        if (!fs.existsSync(fullPath)) {
          console.error('❌ Referenced photo file does not exist:', fullPath);
          return res.status(400).json({
            success: false,
            message: "Referenced photo file not found. Please re-upload the photo.",
            error: "PHOTO_FILE_NOT_FOUND"
          });
        }
        console.log('✅ Photo file verified on disk:', fullPath);
      }
    }
    
    if (customPhotos && customPhotos.length > 0) {
      console.log("📸 Multiple customPhotos received:", customPhotos.length);
      
      // Validate each photo
      for (let index = 0; index < customPhotos.length; index++) {
        const photo = customPhotos[index];
        console.log(`  Photo ${index + 1}:`, {
          hasFilePath: !!photo.filePath,
          hasImage: !!photo.image,
          filePath: photo.filePath,
          name: photo.name,
          size: photo.size
        });
        
        // Validate photo data
        if (!photo.filePath && !photo.image) {
          return res.status(400).json({
            success: false,
            message: `Photo ${index + 1} data is incomplete. Either filePath or image data is required.`
          });
        }
        
        // If filePath exists, verify file exists on disk
        if (photo.filePath) {
          // fs is already imported at the top
          const fullPath = `C:\\Users\\ADMIN\\Desktop\\mwtproject (3)current\\mwtproject (3)fe\\mwtproject\\mwtc\\mwtc12\\backend${photo.filePath}`;
          if (!fs.existsSync(fullPath)) {
            console.error(`❌ Photo ${index + 1} file does not exist:`, fullPath);
            return res.status(400).json({
              success: false,
              message: `Photo ${index + 1} file not found. Please re-upload the photos.`,
              error: "PHOTO_FILE_NOT_FOUND"
            });
          }
          console.log(`✅ Photo ${index + 1} file verified on disk:`, fullPath);
        }
      }
    }
    
    // Validate basic inputs
    if (quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Quantity must be at least 1" 
      });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // ✅ Handle custom design items with proper validation
    if (customDesign) {
      console.log("🎨 Processing custom design:", customDesign.name);
      
      // Validate required custom design fields
      if (!customDesign.name || !customDesign.price) {
        return res.status(400).json({ 
          success: false,
          message: "Custom design must have name and price" 
        });
      }

      // Validate image data
      if (!customDesign.image || !customDesign.image.startsWith('data:image/')) {
        return res.status(400).json({ 
          success: false,
          message: "Custom design must have valid image data" 
        });
      }

      // Create unique cart item ID
      const cartItemId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare custom design data with defaults
      const customDesignData = {
        name: customDesign.name,
        price: Number(customDesign.price),
        image: customDesign.image,
        designData: customDesign.designData || "",
        material: {
          type: customDesign.material?.type || "resin",
          name: customDesign.material?.name || "Resin",
          description: customDesign.material?.description || "High-quality resin",
          multiplier: Number(customDesign.material?.multiplier || 1)
        },
        size: {
          value: customDesign.size?.value || "4",
          name: customDesign.size?.name || "4 inch",
          multiplier: Number(customDesign.size?.multiplier || 1)
        },
        pricing: {
          basePrice: Number(customDesign.pricing?.basePrice || 299),
          materialMultiplier: Number(customDesign.pricing?.materialMultiplier || 1),
          sizeMultiplier: Number(customDesign.pricing?.sizeMultiplier || 1),
          finalPrice: Number(customDesign.price)
        },
        specifications: {
          material: customDesign.specifications?.material || customDesign.material?.name || "Resin",
          size: customDesign.specifications?.size || customDesign.size?.name || "4 inch",
          customization: customDesign.specifications?.customization || "Hand-crafted based on your design",
          processing: customDesign.specifications?.processing || "3-5 business days"
        }
      };

      // Add custom design to cart
      const customItem = {
        isCustomDesign: true,
        cartItemId: cartItemId,
        customDesign: customDesignData,
        quantity: quantity,
        specialRequest: specialRequest,
        addedAt: new Date()
      };

      console.log("✅ Adding custom item with cartItemId:", cartItemId);
      
      cart.items.push(customItem);
      await cart.save();
      
      // Return updated cart
      await cart.populate("items.product");
      const processedItems = cart.items.map(item => {
        if (item.isCustomDesign) {
          return {
            _id: item._id,
            cartItemId: item.cartItemId,
            isCustomDesign: true,
            customDesign: item.customDesign,
            quantity: item.quantity,
            specialRequest: item.specialRequest,
            addedAt: item.addedAt,
            name: item.customDesign?.name || "Custom Design",
            price: item.customDesign?.price || 0,
            image: item.customDesign?.image || "",
            material: item.customDesign?.material || {},
            size: item.customDesign?.size || {}
          };
        } else {
          return {
            _id: item._id,
            product: item.product,
            quantity: item.quantity,
            specialRequest: item.specialRequest,
            customPhoto: item.customPhoto,
            customPhotos: item.customPhotos || [],
            addedAt: item.addedAt,
            isCustomDesign: false
          };
        }
      });
      
      console.log("✅ Custom design added successfully, total items:", processedItems.length);
      return res.json({ 
        success: true,
        message: "Custom design added to cart",
        items: processedItems,
        totalItems: processedItems.length
      });
    }

    // ✅ Handle regular products
    if (!productId) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID is required for regular products" 
      });
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid product ID format" 
      });
    }

    const existingItem = cart.items.find(
      (item) => !item.isCustomDesign && item.product && item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      if (specialRequest !== undefined) {
        existingItem.specialRequest = specialRequest;
      }
      
      // Handle multiple photos (preferred)
      if (customPhotos && customPhotos.length > 0) {
        existingItem.customPhotos = customPhotos;
        // Clear single photo for consistency
        existingItem.customPhoto = undefined;
        console.log("✅ Updated existing regular product with multiple photos:", customPhotos.length);
      }
      // Handle single photo (backward compatibility)
      else if (customPhoto) {
        existingItem.customPhoto = customPhoto;
        console.log("✅ Updated existing regular product with single photo");
      }
    } else {
      const newItem = { 
        product: productId, 
        quantity, 
        specialRequest,
        isCustomDesign: false,
        addedAt: new Date()
      };
      
      // Handle multiple photos (preferred)
      if (customPhotos && customPhotos.length > 0) {
        newItem.customPhotos = customPhotos;
        console.log("✅ Added new regular product with multiple photos:", customPhotos.length);
      }
      // Handle single photo (backward compatibility)
      else if (customPhoto) {
        newItem.customPhoto = customPhoto;
        console.log("✅ Added new regular product with single photo");
      } else {
        console.log("✅ Added new regular product (no photos)");
      }
      
      cart.items.push(newItem);
    }

    await cart.save();
    
    // 🔍 DEBUG: Verify what was actually saved to database
    console.log("💾 Verifying saved cart data...");
    const savedCart = await Cart.findOne({ user: req.userId }).populate("items.product");
    savedCart.items.forEach((item, index) => {
      if (item.customPhoto || item.customPhotos?.length > 0) {
        console.log(`📝 Item ${index + 1} photo data in DB:`);
        if (item.customPhoto) {
          console.log("  Single photo:", {
            hasFilePath: !!item.customPhoto.filePath,
            hasImage: !!item.customPhoto.image,
            filePath: item.customPhoto.filePath,
            name: item.customPhoto.name,
            size: item.customPhoto.size
          });
        }
        if (item.customPhotos?.length > 0) {
          console.log("  Multiple photos:", item.customPhotos.length, "saved");
        }
      }
    });
    
    await savedCart.populate("items.product");
    
    // Process and return items
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId,
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          customPhoto: item.customPhoto,
          customPhotos: item.customPhotos || [],
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    console.log("✅ Regular product operation complete, total items:", processedItems.length);
    res.json({ 
      success: true,
      message: "Item added to cart",
      items: processedItems,
      totalItems: processedItems.length
    });
  } catch (err) {
    handleCartError(err, res);
  }
});

// ✅ COMPLETELY FIXED Remove from cart with detailed debugging
app.post("/api/cart/remove", verifyUser, async (req, res) => {
  try {
    const { productId, cartItemId, isCustom } = req.body;
    console.log('🗑️ Remove request received:', { 
      userId: req.userId, 
      productId, 
      cartItemId, 
      isCustom 
    });
    
    if (!productId && !cartItemId) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ 
        success: false,
        message: "Product ID or Cart Item ID is required" 
      });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      console.log('❌ No cart found for user:', req.userId);
      return res.status(404).json({ 
        success: false,
        message: "Cart not found" 
      });
    }

    console.log(`📦 Current cart has ${cart.items.length} items BEFORE removal:`);
    cart.items.forEach((item, index) => {
      if (item.isCustomDesign) {
        console.log(`  ${index + 1}. 🎨 Custom: "${item.customDesign?.name}" (cartItemId: "${item.cartItemId}", _id: "${item._id}")`);
      } else {
        console.log(`  ${index + 1}. 🛍️ Regular: Product "${item.product}" (_id: "${item._id}")`);
      }
    });

    const originalLength = cart.items.length;
    let removedItems = [];

    if (isCustom) {
      // ✅ Remove custom design item with comprehensive matching
      console.log('🎨 Attempting to remove CUSTOM design item...');
      console.log('🔍 Looking for custom item matching:', { productId, cartItemId });
      
      cart.items = cart.items.filter(item => {
        if (item.isCustomDesign) {
          const itemCartId = item.cartItemId;
          const itemMongoId = item._id.toString();
          
          // ✅ Multiple matching strategies
          const matchByCartItemId = itemCartId === productId || itemCartId === cartItemId;
          const matchByMongoId = itemMongoId === productId || itemMongoId === cartItemId;
          const shouldRemove = matchByCartItemId || matchByMongoId;
          
          if (shouldRemove) {
            console.log('✅ FOUND CUSTOM MATCH! Removing:', {
              name: item.customDesign?.name,
              cartItemId: itemCartId,
              mongoId: itemMongoId,
              matchedBy: matchByCartItemId ? 'cartItemId' : 'mongoId',
              productIdSent: productId,
              cartItemIdSent: cartItemId
            });
            removedItems.push(item);
            return false; // Remove this item
          }
          
          console.log('❌ Custom item did NOT match:', {
            name: item.customDesign?.name,
            itemCartId,
            itemMongoId,
            searchingFor: { productId, cartItemId }
          });
          return true; // Keep this item
        }
        return true; // Keep all non-custom items
      });
      
    } else {
      // ✅ Remove regular product item
      console.log('🛍️ Attempting to remove REGULAR product item...');
      console.log('🔍 Looking for regular product with ID:', productId);
      
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.log('❌ Invalid product ID format:', productId);
        return res.status(400).json({ 
          success: false,
          message: "Invalid product ID format" 
        });
      }
      
      cart.items = cart.items.filter(item => {
        if (!item.isCustomDesign && item.product) {
          const itemProductId = item.product.toString();
          const itemMongoId = item._id.toString();
          const shouldRemove = itemProductId === productId || itemMongoId === productId || itemMongoId === cartItemId;
          
          if (shouldRemove) {
            console.log('✅ FOUND REGULAR MATCH! Removing:', {
              productId: itemProductId,
              mongoId: itemMongoId,
              matchedBy: itemProductId === productId ? 'productId' : 'mongoId'
            });
            removedItems.push(item);
            return false; // Remove this item
          }
          
          console.log('❌ Regular item did NOT match:', {
            itemProductId,
            itemMongoId,
            searchingFor: productId
          });
          return true; // Keep this item
        }
        return true; // Keep custom items and items without product
      });
    }

    const finalLength = cart.items.length;
    console.log(`📦 Removal result: ${originalLength} -> ${finalLength} items (removed ${removedItems.length} items)`);
    
    if (removedItems.length === 0) {
      console.log('❌ NO ITEMS WERE REMOVED');
      console.log('🔍 Current cart items after failed removal:');
      cart.items.forEach((item, index) => {
        if (item.isCustomDesign) {
          console.log(`  ${index + 1}. 🎨 Custom: "${item.customDesign?.name}" (cartItemId: "${item.cartItemId}")`);
        } else {
          console.log(`  ${index + 1}. 🛍️ Regular: Product "${item.product}"`);
        }
      });
      return res.status(404).json({ 
        success: false,
        message: isCustom ? "Custom item not found in cart" : "Product not found in cart" 
      });
    }

    // Save the cart
    await cart.save();
    console.log('✅ Cart saved successfully after removal');

    // Populate products and return
    await cart.populate("items.product");
    
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId,
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    console.log(`✅ REMOVAL SUCCESSFUL! Items removed: ${removedItems.length}`);
    removedItems.forEach((removed, index) => {
      if (removed.isCustomDesign) {
        console.log(`  Removed ${index + 1}: Custom "${removed.customDesign?.name}"`);
      } else {
        console.log(`  Removed ${index + 1}: Regular Product "${removed.product}"`);
      }
    });
    
    res.json({ 
      success: true,
      message: "Item removed from cart successfully",
      items: processedItems,
      totalItems: processedItems.length,
      removedCount: removedItems.length
    });
  } catch (err) {
    console.error('❌ Remove operation failed:', err);
    res.status(500).json({
      success: false,
      message: "Server error while removing item from cart",
      error: err.message
    });
  }
});

// ✅ Fixed Update cart item quantity
app.post("/api/cart/update", verifyUser, async (req, res) => {
  try {
    const { productId, cartItemId, quantity, isCustom } = req.body;
    console.log('🔄 Update quantity request:', { productId, cartItemId, quantity, isCustom, userId: req.userId });
    
    if (quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Quantity must be at least 1" 
      });
    }
    
    if (!productId && !cartItemId) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID or Cart Item ID is required" 
      });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: "Cart not found" 
      });
    }

    let itemFound = false;
    
    cart.items = cart.items.map(item => {
      if (isCustom && item.isCustomDesign) {
        if (item.cartItemId === cartItemId || item._id.toString() === productId) {
          console.log('✅ Updating custom item quantity:', item.customDesign?.name);
          item.quantity = quantity;
          itemFound = true;
        }
      } else if (!isCustom && !item.isCustomDesign && item.product) {
        if (item.product.toString() === productId || item._id.toString() === productId) {
          console.log('✅ Updating regular item quantity');
          item.quantity = quantity;
          itemFound = true;
        }
      }
      return item;
    });

    if (!itemFound) {
      console.log('❌ Item not found for quantity update');
      return res.status(404).json({ 
        success: false,
        message: "Item not found in cart" 
      });
    }

    await cart.save();
    await cart.populate("items.product");
    
    // Process and return updated items
    const processedItems = cart.items.map(item => {
      if (item.isCustomDesign) {
        return {
          _id: item._id,
          cartItemId: item.cartItemId,
          isCustomDesign: true,
          customDesign: item.customDesign,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          name: item.customDesign?.name || "Custom Design",
          price: item.customDesign?.price || 0,
          image: item.customDesign?.image || "",
          material: item.customDesign?.material || {},
          size: item.customDesign?.size || {}
        };
      } else {
        return {
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: item.addedAt,
          isCustomDesign: false
        };
      }
    });
    
    console.log('✅ Quantity update successful');
    res.json({ 
      success: true,
      message: "Quantity updated successfully",
      items: processedItems,
      totalItems: processedItems.length
    });
  } catch (err) {
    handleCartError(err, res);
  }
});

// ✅ Fixed Clear cart
app.post("/api/cart/clear", verifyUser, async (req, res) => {
  try {
    console.log('🗑️ Clearing entire cart for user:', req.userId);
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    } else {
      cart.items = [];
      await cart.save();
    }
    
    console.log('✅ Cart cleared successfully');
    res.json({ 
      success: true,
      message: "Cart cleared successfully",
      items: [],
      totalItems: 0
    });
  } catch (err) {
    handleCartError(err, res);
  }
});


// Import verifyUser middleware as needed
//wishlist routes 
app.get("/api/wishlist", verifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    let wishlist = await Wishlist.findOne({ userId }).populate("products");
    if (!wishlist) {
      // Create empty wishlist if none exists
      wishlist = await Wishlist.create({ userId, products: [] });
    }
    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.post("/api/wishlist/add", verifyUser, async (req, res) => {
  const { productId } = req.body;
  const userId = req.userId;

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, products: [productId] });
  } else {
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }
    await wishlist.save();
  }

  await wishlist.populate("products");
  res.json({ success: true, wishlist });
});
app.post("/api/wishlist/remove", verifyUser, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    // Remove productId from wishlist products array
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId.toString()
    );

    await wishlist.save();
    await wishlist.populate("products");

    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// --- Admin Routes ---
app.post("/admin/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, password: hashedPassword, name });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Old admin login route - redirect to new API route
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔄 Old admin login route hit, processing...');
    
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(admin._id, true);
    
    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/admin/dashboard", verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin! You are authenticated.",
    adminId: req.adminId,
  });
});
// ======================== ADMIN STATS API ========================
app.get("/api/admin/stats", async (req, res) => {
  try {
    const users = await User.countDocuments();       // User schema is already defined in server.js
    const products = await Product.countDocuments(); // Product imported from models
    const categories = await Category.countDocuments(); // Category schema is already in server.js
    const orders = await Order.countDocuments(); // Count actual orders from Order model

    res.json({
      success: true,
      stats: { users, products, categories, orders },
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// --- Product Routes ---
app.post("/addproducts", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, stock, description } = req.body;

    if (!name || !price || !category || !stock) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existing = await Product.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Product already exists" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const product = await Product.create({
      name,
      price,
      category,
      stock,
      description, // ✅ new field saved
      image,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/products/:id", async (req, res) => {
  try {
    console.log("🛠 Fetching product from DB with id:", req.params.id); // ✅ add this
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error("❌ Error in /api/products/:id:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});



// ✅ Update product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, stock, description } = req.body;

    const updateData = { name, price, category, stock, description }; // ✅ added
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===================== CATEGORY APIs =====================

// Add category with image
app.post("/addcategory", upload.single("image"), async (req, res) => {
  try {
    const { categoryname } = req.body;

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || "";

    const newCategory = new Category({ categoryname, image });
    await newCategory.save();

    res.json({ success: true, category: newCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all categories
app.get("/getcategories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/deletecategory/:id", async (req, res) => {
  console.log("Delete request received with id:", req.params.id);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid category ID" });
  }

  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting category" });
  }
});


// ======================== ORDER MODEL ========================

// --- Order Item Schema ---
const orderItemSchema = new mongoose.Schema({
  // For regular products
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  
  // For custom designs
  customDesign: {
    name: String,
    price: Number,
    image: String,
    designData: String,
    material: {
      type: String,
      name: String,
      description: String,
      multiplier: Number
    },
    size: {
      value: String,
      name: String,
      multiplier: Number
    },
    pricing: {
      basePrice: Number,
      materialMultiplier: Number,
      sizeMultiplier: Number,
      finalPrice: Number
    },
    specifications: {
      material: String,
      size: String,
      customization: String,
      processing: String
    }
  },
  
  isCustomDesign: { type: Boolean, default: false },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  specialRequest: { type: String, default: "" },
  
  // Custom photo uploaded by user (backward compatibility)
  customPhoto: {
    filePath: String, // File path in uploads folder (new system)
    image: String,    // Base64 encoded image (legacy support)
    name: String,     // Original filename
    size: Number,     // File size in bytes
    mimeType: String, // MIME type (renamed to avoid 'type' keyword conflict)
    uploadedAt: Date  // Upload timestamp
  },
  
  // Multiple photos uploaded by user
  customPhotos: [{
    id: String,       // Frontend generated ID
    filePath: String, // File path in uploads folder
    image: String,    // Full URL or base64
    preview: String,  // Preview URL if different
    name: String,     // Original filename
    size: Number,     // File size in bytes
    mimeType: String, // MIME type
    order: Number,    // Display order
    uploadedAt: Date  // Upload timestamp
  }]
}, { _id: false });

// --- Order Schema ---
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orderId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  items: [orderItemSchema],
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // Razorpay payment details
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Order status
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  
  // Shipping details
  shippingAddress: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  
  // Timestamps
  orderDate: { type: Date, default: Date.now },
  paymentDate: Date,
  deliveryDate: Date
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

// ======================== RAZORPAY SETUP ========================

// Add these imports at the top of your server.js (if not already there)
// import Razorpay from "razorpay";
// import crypto from "crypto";

// Initialize Razorpay (add after your other model definitions)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "your_test_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_test_key_secret",
});

// ======================== CUSTOMER PHOTO UPLOAD ROUTE ========================

// ✅ Customer photo upload endpoint with enhanced validation
app.post('/api/customer/upload-photo', upload.single('photo'), (req, res) => {
  try {
    console.log('📷 Customer photo upload request received');
    console.log('📋 Request details:', {
      hasFile: !!req.file,
      body: req.body,
      headers: req.headers['content-type']
    });
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'No photo file uploaded',
        error: 'FILE_MISSING'
      });
    }
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      console.error('❌ Invalid file type:', req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        error: 'INVALID_FILE_TYPE'
      });
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      console.error('❌ File too large:', req.file.size);
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    const fullPath = `C:\\Users\\ADMIN\\Desktop\\mwtproject (3)current\\mwtproject (3)fe\\mwtproject\\mwtc\\mwtc12\\backend\\uploads\\${req.file.filename}`;
    
    // Verify file was actually saved
    // fs is already imported at the top
    if (!fs.existsSync(fullPath)) {
      console.error('❌ File not saved to disk:', fullPath);
      return res.status(500).json({
        success: false,
        message: 'File upload failed - file not saved',
        error: 'SAVE_FAILED'
      });
    }
    
    console.log('✅ Customer photo saved successfully:', {
      filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
    
    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        filePath: filePath,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Customer photo upload error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message,
      errorCode: 'UPLOAD_ERROR'
    });
  }
});

// ======================== PAYMENT & ORDER ROUTES ========================

// ✅ Create Razorpay Order
// ✅ FIXED Create Razorpay Order route
// ✅ Replace the order creation part in your server.js
// ✅ FIXED: Updated /api/payment/create-order route
app.post("/api/payment/create-order", verifyUser, async (req, res) => {
  try {
    const { amount, currency = "INR", shippingAddress } = req.body;
    console.log("💳 Creating payment order:", { amount, currency, userId: req.userId });

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }

    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Razorpay credentials missing");
      return res.status(500).json({
        success: false,
        message: "Payment gateway configuration error"
      });
    }

    // ✅ FIXED: Get user's cart with better error handling
    let cart;
    try {
      cart = await Cart.findOne({ user: req.userId }).populate("items.product");
      console.log("📦 Cart found:", cart ? `${cart.items.length} items` : "No cart");
    } catch (cartError) {
      console.error("❌ Error fetching cart:", cartError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch cart"
      });
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // ✅ FIXED: Calculate total with detailed logging
    let calculatedTotal = 0;
    console.log("🧮 Processing cart items:");
    
    cart.items.forEach((item, index) => {
      try {
        let itemPrice = 0;
        let itemName = "";
        
        console.log(`\n🔍 Item ${index + 1}:`, {
          isCustomDesign: item.isCustomDesign,
          hasProduct: !!item.product,
          hasCustomDesign: !!item.customDesign,
          quantity: item.quantity
        });
        
        if (item.isCustomDesign && item.customDesign) {
          // Custom design item
          itemPrice = Number(item.customDesign.price) || Number(item.customDesign.pricing?.finalPrice) || 0;
          itemName = item.customDesign.name || "Custom Design";
          console.log(`🎨 Custom design: ${itemName}, price: ${itemPrice}`);
        } else if (item.product) {
          // Regular product item
          itemPrice = Number(item.product.price) || 0;
          itemName = item.product.name || "Product";
          console.log(`📦 Regular product: ${itemName}, price: ${itemPrice}`);
        } else {
          console.warn(`⚠️ Item ${index + 1} has no valid product or custom design`);
          return; // Skip this item
        }
        
        const quantity = Number(item.quantity) || 1;
        const itemTotal = itemPrice * quantity;
        calculatedTotal += itemTotal;
        
        console.log(`✅ Item total: ${itemPrice} × ${quantity} = ${itemTotal}`);
      } catch (itemError) {
        console.error(`❌ Error processing cart item ${index}:`, itemError);
      }
    });

    console.log(`💰 Final calculated total: ${calculatedTotal}, Requested amount: ${amount}`);

    // Verify amount matches (allow small rounding differences)
    if (Math.abs(calculatedTotal - amount) > 2) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch: Cart total ₹${calculatedTotal.toFixed(2)}, requested ₹${amount.toFixed(2)}`
      });
    }

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("🆔 Generated order ID:", orderId);

    // Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: orderId,
        notes: {
          userId: req.userId.toString(),
          orderType: "ecommerce"
        }
      });
      console.log("✅ Razorpay order created:", razorpayOrder.id);
    } catch (razorpayError) {
      console.error("❌ Razorpay order creation failed:", razorpayError);
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order",
        error: razorpayError.message
      });
    }

    // ✅ PHOTO VALIDATION: Verify all uploaded photos exist before creating order
    console.log("📷 Validating photos for order creation...");
    // fs is already imported at the top
    const baseUploadPath = 'C:\\Users\\ADMIN\\Desktop\\mwtproject (3)current\\mwtproject (3)fe\\mwtproject\\mwtc\\mwtc12\\backend';
    
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      
      // Validate single custom photo
      if (item.customPhoto && item.customPhoto.filePath) {
        const photoPath = `${baseUploadPath}${item.customPhoto.filePath}`;
        if (!fs.existsSync(photoPath)) {
          console.error(`❌ Order validation failed - Photo missing for item ${i + 1}:`, photoPath);
          return res.status(400).json({
            success: false,
            message: `Photo upload issue detected for item ${i + 1}. Customer photo file is missing.`,
            error: "PHOTO_FILE_MISSING",
            details: `Please contact customer for re-upload: ${item.customPhoto.name || 'customer-photo.jpg'}`
          });
        }
        console.log(`✅ Photo validated for item ${i + 1}:`, item.customPhoto.name);
      }
      
      // Validate multiple custom photos
      if (item.customPhotos && item.customPhotos.length > 0) {
        for (let j = 0; j < item.customPhotos.length; j++) {
          const photo = item.customPhotos[j];
          if (photo.filePath) {
            const photoPath = `${baseUploadPath}${photo.filePath}`;
            if (!fs.existsSync(photoPath)) {
              console.error(`❌ Order validation failed - Photo ${j + 1} missing for item ${i + 1}:`, photoPath);
              return res.status(400).json({
                success: false,
                message: `Photo upload issue detected for item ${i + 1}, photo ${j + 1}. Customer photo file is missing.`,
                error: "PHOTO_FILE_MISSING",
                details: `Please contact customer for re-upload: ${photo.name || 'customer-photo.jpg'}`
              });
            }
            console.log(`✅ Photo ${j + 1} validated for item ${i + 1}:`, photo.name);
          }
        }
      }
    }
    
    console.log("✅ All photos validated successfully for order creation");
    
    // ✅ FIXED: Process order items with better error handling
    const orderItems = [];
    
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      try {
        const orderItem = {
          quantity: Number(item.quantity) || 1,
          specialRequest: item.specialRequest || "",
          isCustomDesign: Boolean(item.isCustomDesign),
          customPhoto: item.customPhoto ? (() => {
            const photoData = {
              filePath: item.customPhoto.filePath || null,
              image: item.customPhoto.image || null, // Keep for backward compatibility
              name: item.customPhoto.name || 'customer-photo.jpg',
              size: item.customPhoto.size || 0,
              mimeType: item.customPhoto.type || 'image/jpeg', // Updated field name
              uploadedAt: item.customPhoto.uploadedAt || new Date().toISOString()
            };
            console.log(`📷 PHOTO FLOW - Order item ${i + 1} single photo:`, {
              hasFilePath: !!photoData.filePath,
              hasImageData: !!photoData.image,
              fileName: photoData.name,
              fileSize: photoData.size,
              mimeType: photoData.mimeType
            });
            return photoData;
          })() : null,
          customPhotos: item.customPhotos ? (() => {
            const photosArray = item.customPhotos.map((photo, photoIndex) => {
              const photoData = {
                id: photo.id || null,
                filePath: photo.filePath || null,
                image: photo.image || photo.preview || null,
                preview: photo.preview || null,
                name: photo.name || 'customer-photo.jpg',
                size: photo.size || 0,
                mimeType: photo.type || 'image/jpeg',
                order: photo.order || (photoIndex + 1),
                uploadedAt: photo.uploadedAt || new Date().toISOString()
              };
              console.log(`📸 PHOTO FLOW - Order item ${i + 1}, photo ${photoIndex + 1}:`, {
                hasFilePath: !!photoData.filePath,
                hasImageData: !!photoData.image,
                fileName: photoData.name,
                fileSize: photoData.size,
                mimeType: photoData.mimeType
              });
              return photoData;
            });
            console.log(`📷 PHOTO FLOW - Order item ${i + 1} has ${photosArray.length} photos total`);
            return photosArray;
          })() : []
        };

        if (item.isCustomDesign && item.customDesign) {
          // Handle custom design
          const customPrice = Number(item.customDesign.price) || Number(item.customDesign.pricing?.finalPrice) || 0;
          
          if (customPrice <= 0) {
            console.error(`❌ Invalid custom design price for item ${i + 1}:`, item.customDesign);
            return res.status(400).json({
              success: false,
              message: `Custom design item ${i + 1} has invalid price`
            });
          }

          orderItem.product = null;
          orderItem.customDesign = {
            name: item.customDesign.name || "Custom Design",
            price: customPrice,
            image: item.customDesign.image || "",
            designData: item.customDesign.designData || "",
            material: item.customDesign.material || {},
            size: item.customDesign.size || {},
            pricing: item.customDesign.pricing || {},
            specifications: item.customDesign.specifications || {}
          };
          orderItem.price = customPrice;

          console.log(`✅ Added custom design to order: ${orderItem.customDesign.name} - ₹${customPrice}`);

        } else if (item.product) {
          // Handle regular product
          const productPrice = Number(item.product.price) || 0;
          
          if (productPrice <= 0) {
            console.error(`❌ Invalid product price for item ${i + 1}:`, item.product);
            return res.status(400).json({
              success: false,
              message: `Product item ${i + 1} has invalid price`
            });
          }

          orderItem.product = item.product._id;
          orderItem.customDesign = null;
          orderItem.price = productPrice;

          console.log(`✅ Added product to order: ${item.product.name} - ₹${productPrice}`);

        } else {
          console.error(`❌ Invalid item ${i + 1}:`, item);
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1} is neither a product nor custom design`
          });
        }

        orderItems.push(orderItem);

      } catch (itemError) {
        console.error(`❌ Error processing order item ${i + 1}:`, itemError);
        return res.status(500).json({
          success: false,
          message: `Failed to process cart item ${i + 1}: ${itemError.message}`
        });
      }
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items to order"
      });
    }

    console.log(`✅ Processed ${orderItems.length} order items`);

    // ✅ FIXED: Create order in database
    let savedOrder;
    try {
      const orderData = {
        user: req.userId,
        orderId: orderId,
        items: orderItems,
        totalAmount: amount,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "pending",
        orderStatus: "pending",
        shippingAddress: shippingAddress || {},
        orderDate: new Date()
      };

      console.log("📦 Creating order in database...");
      const order = new Order(orderData);
      savedOrder = await order.save();
      console.log("✅ Order saved to database:", savedOrder.orderId);

    } catch (orderError) {
      console.error("❌ Database order creation failed:", orderError);
      return res.status(500).json({
        success: false,
        message: "Failed to save order to database",
        error: orderError.message
      });
    }

    // Success response
    res.json({
      success: true,
      message: "Order created successfully",
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: orderId
      },
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("❌ Create order error:", error);
    console.error("❌ Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ Verify Payment
app.post("/api/payment/verify", verifyUser, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = req.body;

    console.log("🔍 Verifying payment:", { 
      razorpay_order_id, 
      razorpay_payment_id, 
      orderId 
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data"
      });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_test_key_secret")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.error("❌ Payment signature verification failed");
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature"
      });
    }

    // Find and update order in database
    const order = await Order.findOne({ 
      $or: [
        { razorpayOrderId: razorpay_order_id },
        { orderId: orderId }
      ]
    });

    if (!order) {
      console.error("❌ Order not found for verification");
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order with payment details
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentDate = new Date();

    await order.save();
    console.log("✅ Payment verified and order updated:", order.orderId);

    // Clear user's cart after successful payment
    try {
      await Cart.findOneAndUpdate(
        { user: req.userId },
        { items: [] }
      );
      console.log("✅ Cart cleared after successful payment");
    } catch (cartError) {
      console.warn("⚠️ Failed to clear cart:", cartError.message);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        orderId: order.orderId,
        paymentId: razorpay_payment_id,
        amount: order.totalAmount,
        status: order.paymentStatus
      }
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
});
// ✅ Enhanced admin orders route with status update
// ✅ Update this route in server.js
app.get("/api/admin/all-orders", async (req, res) => {
  try {
    console.log("📦 Getting all orders...");
    
    const orders = await Order.find({})
      .populate("user", "name email phone")
      .populate("items.product", "name price image description category") // ✅ Add image field
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${orders.length} orders`);
    
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("Error:", error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Update order status
app.put("/api/admin/orders/:orderId/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { orderId } = req.params;

    console.log(`📝 Updating order ${orderId} to ${status}`);

    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found"
      });
    }

    order.orderStatus = status;
    
    // Add timestamps for different statuses
    if (status === "shipped") {
      order.shippedAt = new Date();
    } else if (status === "delivered") {
      order.deliveredAt = new Date();
    }
    
    // Add admin notes if provided
    if (notes) {
      if (!order.adminNotes) order.adminNotes = [];
      order.adminNotes.push({
        note: notes,
        addedAt: new Date(),
        addedBy: "Admin"
      });
    }

    await order.save();
    
    console.log("✅ Order status updated successfully");

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: order
    });

  } catch (error) {
    console.error("❌ Update order status error:", error);
    res.json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
});

// ✅ Utility function to process photo URLs with proper encoding
const processPhotoUrl = (filePath) => {
  if (!filePath) return null;
  // Encode spaces and special characters for URL
  const encodedPath = filePath.replace(/\s+/g, '%20');
  return `http://localhost:${PORT}${encodedPath}`;
};

// ✅ Get single order details with enhanced photo URL processing
app.get("/api/admin/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId: orderId })
      .populate("user", "name email phone")
      .populate("items.product", "name price image description");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found"
      });
    }

    // Process photo URLs for proper encoding
    const processedOrder = order.toObject();
    processedOrder.items = processedOrder.items.map(item => {
      // Process single custom photo
      if (item.customPhoto) {
        item.customPhoto.encodedUrl = processPhotoUrl(item.customPhoto.filePath);
        // Always provide the correctly encoded URL
        item.customPhoto.safeUrl = processPhotoUrl(item.customPhoto.filePath);
        console.log('📷 Processing single photo:', {
          original: item.customPhoto.image,
          encoded: item.customPhoto.encodedUrl
        });
      }
      
      // Process multiple custom photos
      if (item.customPhotos && item.customPhotos.length > 0) {
        item.customPhotos = item.customPhotos.map(photo => {
          photo.encodedUrl = processPhotoUrl(photo.filePath);
          // Always provide the correctly encoded URL
          photo.safeUrl = processPhotoUrl(photo.filePath);
          console.log('📸 Processing multiple photo:', {
            original: photo.image,
            encoded: photo.encodedUrl,
            filePath: photo.filePath
          });
          return photo;
        });
      }
      
      return item;
    });

    res.json({
      success: true,
      order: processedOrder
    });
  } catch (error) {
    console.error("❌ Get order details error:", error);
    res.json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message
    });
  }
});

// ✅ Admin analytics
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ paymentStatus: "paid" });
    const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });
    const shippedOrders = await Order.countDocuments({ orderStatus: "shipped" });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "delivered" });

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const stats = {
      totalOrders,
      paidOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      avgOrderValue: paidOrders > 0 ? (totalRevenue[0]?.total || 0) / paidOrders : 0,
      recentOrders
    };

    res.json({
      success: true,
      analytics: stats
    });
  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Customer orders route (for customer order history)
app.get("/api/customer/orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📦 Fetching orders for user ID:', userId);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('❌ Invalid user ID format:', userId);
      return res.json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    const orders = await Order.find({ user: userId })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${orders.length} orders for user ${userId}`);

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("❌ Customer orders error:", error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Add this route to server.js for OrderSuccess page
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log("📦 Fetching order details for:", orderId);
    
    if (!orderId || orderId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }
    
    const order = await Order.findOne({ orderId: orderId })
      .populate("items.product", "name price image description")
      .populate("user", "name email phone");

    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log("✅ Order found:", order.orderId);

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error("❌ Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    });
  }
});
//cancel order
app.delete('/api/customer/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const deleted = await Order.deleteOne({ _id: orderId });
    if (deleted.deletedCount === 1) {
      return res.json({ success: true });
    }
    return res.json({ success: false, message: "Order not found." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// --- Test Route ---
app.get("/", (req, res) => {
  res.send("✅ Backend is working!");
});
// ---------- GET /api/admin/users (simple list + counts) ----------
app.get('/api/admin/users', async (req, res) => {
  try {
    console.log('📊 Admin users request received');
    const { page = '1', limit = '1000' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(1000, Math.max(1, parseInt(limit, 10) || 1000));
    const skip = (pageNum - 1) * perPage;

    // Project minimal fields for the UI (removed isActive since blocking is removed)
    const projection = {
      name: 1, email: 1, phone: 1, role: 1, createdAt: 1, avatar: 1, provider: 1, isEmailVerified: 1
    };

    const [users, totalCount, adminCount, customerCount] = await Promise.all([
      User.find({}, projection).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      User.countDocuments({ role: 'customer' })
    ]);

    console.log(`✅ Found ${users.length} users, total: ${totalCount}`);

    return res.json({
      success: true,
      users,
      totalCount,
      counts: {
        admins: adminCount,
        customers: customerCount
      },
      page: pageNum,
      limit: perPage
    });
  } catch (e) {
    console.error('❌ Error fetching users:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ---------- DELETE /api/admin/users/:id ----------
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Delete user request:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('✅ User deleted successfully:', deletedUser.email);
    return res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser: { id: deletedUser._id, email: deletedUser.email }
    });
  } catch (e) {
    console.error('❌ Error deleting user:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});


// ---------- GET /api/admin/orders/:orderId/photos (Get all photos from an order) ----------
app.get('/api/admin/orders/:orderId/photos', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('📷 Admin requesting photos for order:', orderId);
    
    const order = await Order.findOne({ orderId: orderId })
      .populate("user", "name email")
      .populate("items.product", "name");
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Extract all custom photos from order items
    const photos = [];
    order.items.forEach((item, index) => {
      const itemName = item.isCustomDesign ? item.customDesign?.name : item.product?.name || 'Unknown Item';
      
      // Handle multiple photos (preferred)
      if (item.customPhotos && item.customPhotos.length > 0) {
        item.customPhotos.forEach((photo, photoIndex) => {
          photos.push({
            itemIndex: index,
            photoIndex: photoIndex,
            itemName: itemName,
            photo: {
              id: photo.id,
              image: photo.image || photo.preview,
              filePath: photo.filePath,
              // Provide properly encoded URL for direct access
              url: photo.filePath ? `http://localhost:${PORT}${photo.filePath.replace(/\s+/g, '%20')}` : null,
              name: photo.name || `order-${orderId}-item-${index}-photo-${photoIndex + 1}.jpg`,
              size: photo.size || 0,
              type: photo.mimeType || photo.type || 'image/jpeg',
              order: photo.order || (photoIndex + 1),
              uploadedAt: photo.uploadedAt || order.createdAt
            },
            specialRequest: item.specialRequest || '',
            isMultiple: true
          });
        });
      }
      // Handle single photo (backward compatibility)
      else if (item.customPhoto && item.customPhoto.image) {
        photos.push({
          itemIndex: index,
          photoIndex: 0,
          itemName: itemName,
          photo: {
            image: item.customPhoto.image,
            filePath: item.customPhoto.filePath,
            // Provide properly encoded URL for direct access
            url: item.customPhoto.filePath ? `http://localhost:${PORT}${item.customPhoto.filePath.replace(/\s+/g, '%20')}` : null,
            name: item.customPhoto.name || `order-${orderId}-item-${index}.jpg`,
            size: item.customPhoto.size || 0,
            type: item.customPhoto.mimeType || item.customPhoto.type || 'image/jpeg',
            uploadedAt: item.customPhoto.uploadedAt || order.createdAt
          },
          specialRequest: item.specialRequest || '',
          isMultiple: false
        });
      }
    });
    
    console.log(`✅ Found ${photos.length} photos in order ${orderId}`);
    
    res.json({
      success: true,
      orderId: orderId,
      customerName: order.user?.name || order.shippingAddress?.name || 'Unknown',
      customerEmail: order.user?.email || order.shippingAddress?.email || 'Unknown',
      orderDate: order.createdAt,
      photos: photos
    });
  } catch (error) {
    console.error('❌ Error fetching order photos:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order photos' });
  }
});

// ---------- GET /api/admin/download-photo/:orderId/:itemIndex/:photoIndex (Download specific photo) ----------
// Two routes: one for single photo (backward compatibility) and one for multiple photos
app.get('/api/admin/download-photo/:orderId/:itemIndex', async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    console.log('📥 Admin downloading single photo:', { orderId, itemIndex });
    
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const item = order.items[parseInt(itemIndex)];
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }
    
    // Handle single photo (backward compatibility)
    if (item.customPhoto && item.customPhoto.image) {
      const photoData = item.customPhoto.image;
      const fileName = item.customPhoto.name || `order-${orderId}-item-${itemIndex}.jpg`;
      
      // Extract base64 data
      const mimeMatch = photoData.match(/^data:([^;]+);base64,(.+)$/);
      
      if (!mimeMatch) {
        return res.status(400).json({ success: false, message: 'Invalid image data' });
      }
      
      const mimeType = mimeMatch[1];
      const imageBuffer = Buffer.from(mimeMatch[2], 'base64');
      
      // Set response headers for file download
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': imageBuffer.length
      });
      
      console.log('✅ Single photo download initiated:', fileName);
      res.send(imageBuffer);
    } else {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }
  } catch (error) {
    console.error('❌ Error downloading photo:', error);
    return res.status(500).json({ success: false, message: 'Failed to download photo' });
  }
});

app.get('/api/admin/download-photo/:orderId/:itemIndex/:photoIndex', async (req, res) => {
  try {
    const { orderId, itemIndex, photoIndex } = req.params;
    console.log('📥 Admin downloading multiple photo:', { orderId, itemIndex, photoIndex });
    
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const item = order.items[parseInt(itemIndex)];
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }
    
    // Handle multiple photos
    if (item.customPhotos && item.customPhotos.length > 0) {
      const photoIdx = parseInt(photoIndex);
      const photo = item.customPhotos[photoIdx];
      
      if (!photo || !photo.image) {
        return res.status(404).json({ success: false, message: 'Photo not found' });
      }
      
      const photoData = photo.image;
      const fileName = photo.name || `order-${orderId}-item-${itemIndex}-photo-${photoIdx + 1}.jpg`;
      
      // Extract base64 data
      const mimeMatch = photoData.match(/^data:([^;]+);base64,(.+)$/);
      
      if (!mimeMatch) {
        return res.status(400).json({ success: false, message: 'Invalid image data' });
      }
      
      const mimeType = mimeMatch[1];
      const imageBuffer = Buffer.from(mimeMatch[2], 'base64');
      
      // Set response headers for file download
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': imageBuffer.length
      });
      
      console.log('✅ Multiple photo download initiated:', fileName);
      res.send(imageBuffer);
    } else {
      return res.status(404).json({ success: false, message: 'No photos found for this item' });
    }
  } catch (error) {
    console.error('❌ Error downloading photo:', error);
    return res.status(500).json({ success: false, message: 'Failed to download photo' });
  }
});

// ---------- GET /api/admin/debug/photos (Debug photo upload issues) ----------
app.get('/api/admin/debug/photos', async (req, res) => {
  try {
    console.log('🔍 Admin photo debug request');
    
    // fs and path are already imported at the top
    const uploadsDir = 'C:\\Users\\ADMIN\\Desktop\\mwtproject (3)current\\mwtproject (3)fe\\mwtproject\\mwtc\\mwtc12\\backend\\uploads';
    
    // Check uploads directory
    const debugInfo = {
      uploadsDirectory: {
        exists: fs.existsSync(uploadsDir),
        path: uploadsDir,
        permissions: 'unknown'
      },
      recentFiles: [],
      cartIssues: [],
      orderIssues: []
    };
    
    // List recent upload files
    if (debugInfo.uploadsDirectory.exists) {
      try {
        const files = fs.readdirSync(uploadsDir)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            };
          })
          .sort((a, b) => b.created - a.created)
          .slice(0, 10);
        
        debugInfo.recentFiles = files;
      } catch (err) {
        debugInfo.uploadsDirectory.error = err.message;
      }
    }
    
    // Check recent carts with photos
    const recentCarts = await Cart.find({
      $or: [
        { 'items.customPhoto': { $exists: true } },
        { 'items.customPhotos.0': { $exists: true } }
      ]
    }).limit(5).sort({ updatedAt: -1 });
    
    recentCarts.forEach((cart, cartIndex) => {
      cart.items.forEach((item, itemIndex) => {
        if (item.customPhoto && item.customPhoto.filePath) {
          const fullPath = `${uploadsDir}${item.customPhoto.filePath.replace('/uploads/', '\\')}`;
          debugInfo.cartIssues.push({
            cartId: cart._id.toString(),
            itemIndex,
            photoPath: item.customPhoto.filePath,
            fileName: item.customPhoto.name,
            fileExists: fs.existsSync(fullPath),
            fullPath
          });
        }
        
        if (item.customPhotos && item.customPhotos.length > 0) {
          item.customPhotos.forEach((photo, photoIndex) => {
            if (photo.filePath) {
              const fullPath = `${uploadsDir}${photo.filePath.replace('/uploads/', '\\')}`;
              debugInfo.cartIssues.push({
                cartId: cart._id.toString(),
                itemIndex,
                photoIndex,
                photoPath: photo.filePath,
                fileName: photo.name,
                fileExists: fs.existsSync(fullPath),
                fullPath
              });
            }
          });
        }
      });
    });
    
    // Check recent orders with photos
    const recentOrders = await Order.find({
      $or: [
        { 'items.customPhoto': { $exists: true } },
        { 'items.customPhotos.0': { $exists: true } }
      ]
    }).limit(5).sort({ createdAt: -1 });
    
    recentOrders.forEach((order) => {
      order.items.forEach((item, itemIndex) => {
        if (item.customPhoto && item.customPhoto.filePath) {
          const fullPath = `${uploadsDir}${item.customPhoto.filePath.replace('/uploads/', '\\')}`;
          debugInfo.orderIssues.push({
            orderId: order.orderId,
            itemIndex,
            photoPath: item.customPhoto.filePath,
            fileName: item.customPhoto.name,
            fileExists: fs.existsSync(fullPath),
            fullPath
          });
        }
        
        if (item.customPhotos && item.customPhotos.length > 0) {
          item.customPhotos.forEach((photo, photoIndex) => {
            if (photo.filePath) {
              const fullPath = `${uploadsDir}${photo.filePath.replace('/uploads/', '\\')}`;
              debugInfo.orderIssues.push({
                orderId: order.orderId,
                itemIndex,
                photoIndex,
                photoPath: photo.filePath,
                fileName: photo.name,
                fileExists: fs.existsSync(fullPath),
                fullPath
              });
            }
          });
        }
      });
    });
    
    console.log('✅ Photo debug info compiled');
    res.json({
      success: true,
      debug: debugInfo,
      recommendations: [
        'Check if uploads directory exists and has proper permissions',
        'Verify that photo files are being saved correctly',
        'Ensure frontend is sending correct filePath references',
        'Check server logs for upload errors'
      ]
    });
  } catch (error) {
    console.error('❌ Photo debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate photo debug info',
      error: error.message
    });
  }
});

// ---------- POST /api/admin/users (Create new user) ----------
app.post('/api/admin/users', async (req, res) => {
  try {
    const { name, email, phone, role = 'customer' } = req.body;
    console.log('➕ Create user request:', { name, email, role });
    
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    
    // Generate a random password for admin-created users
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const newUser = await User.create({
      name,
      email,
      phone: phone || '',
      role,
      password: hashedPassword,
      isEmailVerified: true // Admin-created users are considered verified
    });
    
    console.log('✅ User created successfully:', newUser.email);
    
    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      createdAt: newUser.createdAt,
      isEmailVerified: newUser.isEmailVerified
    };
    
    return res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: userResponse,
      tempPassword: tempPassword // In production, send this via email instead
    });
  } catch (e) {
    console.error('❌ Error creating user:', e);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// ---------- PUT /api/admin/users/:id (Update user) ----------
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;
    console.log('✏️ Update user request:', { id, name, email, role });
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, select: 'name email phone role createdAt isEmailVerified avatar' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('✅ User updated successfully:', updatedUser.email);
    return res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (e) {
    console.error('❌ Error updating user:', e);
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Serve SPA index.html for all non-API routes (Express 5 compatible)
app.get(/^(?!\/api|\/uploads).*$/, (req, res) => {
  const indexFile = path.join(frontendDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return res.status(404).send('Not Found');
});

// ======================== START SERVER ========================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
