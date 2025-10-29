import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subscriptionType: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active'
    },
    subscriptionDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: function() {
        if (this.subscriptionType === 'free') {
          return null;
        }
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }
    },
    paymentId: {
      type: String,
      sparse: true
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ subscriptionType: 1, status: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.subscriptionType === 'free') return true;
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'expired';
    this.save();
    return false;
  }
  return true;
};

// Static method to check user subscription
subscriptionSchema.statics.getUserSubscription = async function(userId) {
  const subscription = await this.findOne({ 
    userId, 
    status: 'active' 
  }).populate('userId', 'name email');
  
  if (!subscription) return null;
  
  // Check if subscription is still valid
  if (!subscription.isActive()) return null;
  
  return subscription;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;