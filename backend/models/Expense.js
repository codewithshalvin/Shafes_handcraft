import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      enum: [
        'materials', 
        'tools', 
        'packaging', 
        'shipping', 
        'marketing', 
        'utilities', 
        'rent', 
        'labor', 
        'insurance', 
        'miscellaneous'
      ]
    },
    type: {
      type: String,
      enum: ['fixed', 'variable'],
      required: true,
      default: 'variable'
    },
    frequency: {
      type: String,
      enum: ['one-time', 'daily', 'weekly', 'monthly', 'yearly'],
      required: true,
      default: 'one-time'
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    week: {
      type: Number // Week number (1-52) - Auto-calculated in pre-save
    },
    month: {
      type: Number // Month number (1-12) - Auto-calculated in pre-save
    },
    year: {
      type: Number // Auto-calculated in pre-save
    },
    receipt: {
      type: String // URL to receipt image
    },
    vendor: {
      name: {
        type: String,
        trim: true
      },
      contact: {
        type: String,
        trim: true
      }
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringConfig: {
      interval: {
        type: Number, // Every X days/weeks/months
        default: 1
      },
      endDate: {
        type: Date
      },
      nextDue: {
        type: Date
      }
    },
    tags: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'paid'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'upi', 'other'],
      default: 'cash'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save middleware to set week, month, year
expenseSchema.pre('save', function(next) {
  const date = new Date(this.date);
  
  // Calculate week number
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / 86400000;
  this.week = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  
  this.month = date.getMonth() + 1;
  this.year = date.getFullYear();
  
  next();
});

// Static method to get expenses by period
expenseSchema.statics.getByPeriod = function(period, value, year) {
  const query = { year };
  
  if (period === 'weekly') {
    query.week = value;
  } else if (period === 'monthly') {
    query.month = value;
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to get total expenses by category
expenseSchema.statics.getTotalByCategory = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Static method to get monthly totals
expenseSchema.statics.getMonthlyTotals = function(year) {
  return this.aggregate([
    {
      $match: { year }
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to get weekly totals
expenseSchema.statics.getWeeklyTotals = function(year) {
  return this.aggregate([
    {
      $match: { year }
    },
    {
      $group: {
        _id: '$week',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Indexes for better performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ year: 1, month: 1 });
expenseSchema.index({ year: 1, week: 1 });
expenseSchema.index({ createdBy: 1, date: -1 });
expenseSchema.index({ status: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;