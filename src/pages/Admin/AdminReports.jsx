import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Plus,
  Filter,
  Download,
  Printer
} from 'lucide-react';
import './AdminReports.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showExpenseList, setShowExpenseList] = useState(false);
  const [expensesList, setExpensesList] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'materials',
    type: 'variable',
    frequency: 'one-time'
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/reports');
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      } else {
        setError('Failed to fetch report data');
      }
    } catch (err) {
      setError('Error fetching report data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseForm)
      });

      const result = await response.json();
      if (result.success) {
        setShowExpenseForm(false);
        setExpenseForm({
          title: '',
          description: '',
          amount: '',
          category: 'materials',
          type: 'variable',
          frequency: 'one-time'
        });
        fetchReportData(); // Refresh data
        alert('Expense added successfully!');
      } else {
        alert('Failed to add expense');
      }
    } catch (err) {
      alert('Error adding expense: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatSalesTrendData = (salesTrend) => {
    return salesTrend.map(item => ({
      month: `${item._id.month}/${item._id.year}`,
      sales: item.sales,
      orders: item.orders
    }));
  };

  const formatExpenseData = (expensesByCategory) => {
    return expensesByCategory.map(item => ({
      name: item._id,
      value: item.total,
      count: item.count
    }));
  };

  const fetchExpenses = async (period) => {
    try {
      setLoadingExpenses(true);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Calculate current week
      const startOfYear = new Date(currentYear, 0, 1);
      const pastDaysOfYear = (now - startOfYear) / 86400000;
      const currentWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      
      let url = 'http://localhost:5000/api/admin/expenses/all';
      
      if (period === 'monthly') {
        url = `http://localhost:5000/api/admin/expenses/monthly?year=${currentYear}&value=${currentMonth}`;
      } else if (period === 'weekly') {
        url = `http://localhost:5000/api/admin/expenses/weekly?year=${currentYear}&value=${currentWeek}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setExpensesList(result.expenses);
        setShowExpenseList(true);
      } else {
        alert('Failed to fetch expenses');
      }
    } catch (err) {
      alert('Error fetching expenses: ' + err.message);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="admin-reports-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-reports-container">
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchReportData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  const { overview, currentPeriod, recentOrders, salesTrend, expensesByCategory } = reportData;

  return (
    <div className="admin-reports-container">
      <div className="reports-header">
        <h1>📈 ShafesHandcraft - Admin Reports</h1>
        <div className="reports-actions">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </select>
          <button 
            onClick={handlePrint} 
            className="print-btn"
          >
            <Printer size={16} />
            Print Report
          </button>
          <button 
            onClick={() => setShowExpenseForm(true)} 
            className="add-expense-btn"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card revenue">
          <div className="card-icon">
            <DollarSign size={32} />
          </div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-value">{formatCurrency(overview.totalSales)}</p>
            <span className="card-subtitle">{overview.totalOrders} orders</span>
          </div>
        </div>

        <div className="summary-card profit">
          <div className="card-icon">
            <TrendingUp size={32} />
          </div>
          <div className="card-content">
            <h3>{selectedPeriod === 'monthly' ? 'Monthly' : 'Weekly'} Profit</h3>
            <p className="card-value">
              {formatCurrency(currentPeriod[selectedPeriod].profit)}
            </p>
            <span className={`card-subtitle ${currentPeriod[selectedPeriod].profit >= 0 ? 'positive' : 'negative'}`}>
              {currentPeriod[selectedPeriod].profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {currentPeriod[selectedPeriod].profit >= 0 ? 'Profitable' : 'Loss'}
            </span>
          </div>
        </div>

        <div className="summary-card sales">
          <div className="card-icon">
            <ShoppingCart size={32} />
          </div>
          <div className="card-content">
            <h3>{selectedPeriod === 'monthly' ? 'Monthly' : 'Weekly'} Sales</h3>
            <p className="card-value">
              {formatCurrency(currentPeriod[selectedPeriod].sales)}
            </p>
            <span className="card-subtitle">{currentPeriod[selectedPeriod].orders} orders</span>
          </div>
        </div>

        <div 
          className="summary-card expenses clickable" 
          onClick={() => fetchExpenses(selectedPeriod)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-icon">
            <Package size={32} />
          </div>
          <div className="card-content">
            <h3>{selectedPeriod === 'monthly' ? 'Monthly' : 'Weekly'} Expenses</h3>
            <p className="card-value">
              {formatCurrency(currentPeriod[selectedPeriod].expenses)}
            </p>
            <span className="card-subtitle">Click to view details →</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Activity */}
      <div className="recent-orders-section">
        <h2>📊 Recent Orders Activity</h2>
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-id">{order.orderNumber || order.orderId}</td>
                    <td className="customer-name">
                      {order.shippingAddress?.name || order.user?.firstName + ' ' + order.user?.lastName || 'N/A'}
                    </td>
                    <td className="amount">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`status-badge status-${order.orderStatus}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-badge payment-${order.paymentStatus}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="order-date">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No recent orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sales Trend Chart */}
        <div className="chart-container large">
          <h3>Sales Trend (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={formatSalesTrendData(salesTrend)}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? formatCurrency(value) : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#salesGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="chart-container">
          <h3>Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={formatExpenseData(expensesByCategory)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {formatExpenseData(expensesByCategory).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Analysis */}
        <div className="chart-container">
          <h3>Profit Analysis</h3>
          <div className="profit-analysis">
            <div className="profit-item">
              <h4>Weekly Profit</h4>
              <div className={`profit-value ${currentPeriod.weekly.profit >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(currentPeriod.weekly.profit)}
              </div>
              <div style={{ width: '100%' }}>
                <p>
                  <span>Sales:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatCurrency(currentPeriod.weekly.sales)}</span>
                </p>
                <p>
                  <span>Expenses:</span>
                  <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(currentPeriod.weekly.expenses)}</span>
                </p>
              </div>
            </div>
            <div className="profit-item">
              <h4>Monthly Profit</h4>
              <div className={`profit-value ${currentPeriod.monthly.profit >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(currentPeriod.monthly.profit)}
              </div>
              <div style={{ width: '100%' }}>
                <p>
                  <span>Sales:</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatCurrency(currentPeriod.monthly.sales)}</span>
                </p>
                <p>
                  <span>Expenses:</span>
                  <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(currentPeriod.monthly.expenses)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="modal-overlay">
          <div className="expense-form-modal">
            <div className="modal-header">
              <h3>Add New Expense</h3>
              <button 
                onClick={() => setShowExpenseForm(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="expense-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                    required
                    placeholder="e.g., Raw materials purchase"
                  />
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                    required
                  >
                    <option value="materials">Materials</option>
                    <option value="tools">Tools</option>
                    <option value="packaging">Packaging</option>
                    <option value="shipping">Shipping</option>
                    <option value="marketing">Marketing</option>
                    <option value="utilities">Utilities</option>
                    <option value="rent">Rent</option>
                    <option value="labor">Labor</option>
                    <option value="insurance">Insurance</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({...expenseForm, type: e.target.value})}
                  >
                    <option value="variable">Variable</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Additional details about the expense..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowExpenseForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense List Modal */}
      {showExpenseList && (
        <div className="modal-overlay" onClick={() => setShowExpenseList(false)}>
          <div className="expense-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedPeriod === 'monthly' ? 'Monthly' : 'Weekly'} Expenses
                {expensesList.length > 0 && ` (${expensesList.length})`}
              </h3>
              <button 
                onClick={() => setShowExpenseList(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="expense-list-content">
              {loadingExpenses ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading expenses...</p>
                </div>
              ) : expensesList.length === 0 ? (
                <div className="empty-state">
                  <p>No expenses found for this period</p>
                </div>
              ) : (
                <div className="expenses-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesList.map((expense) => (
                        <tr key={expense._id}>
                          <td>{formatDate(expense.date)}</td>
                          <td>
                            <div className="expense-title">{expense.title}</div>
                            {expense.description && (
                              <div className="expense-description">{expense.description}</div>
                            )}
                          </td>
                          <td>
                            <span className="category-badge">{expense.category}</span>
                          </td>
                          <td>
                            <span className={`type-badge ${expense.type}`}>{expense.type}</span>
                          </td>
                          <td className="amount-cell">{formatCurrency(expense.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="total-label">Total</td>
                        <td className="total-amount">
                          {formatCurrency(
                            expensesList.reduce((sum, exp) => sum + exp.amount, 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
