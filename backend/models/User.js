import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      trim: true, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 6 
    },
    phone: { 
      type: String, 
      trim: true 
    },
    address: { 
      type: String, 
      trim: true 
    },
    city: { 
      type: String, 
      trim: true 
    },
    state: { 
      type: String, 
      trim: true 
    },
    country: { 
      type: String, 
      trim: true, 
      default: "India" 
    },
    role: { 
      type: String, 
      enum: ['customer', 'admin', 'super_admin'], 
      default: 'customer' 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    // Google OAuth fields
    googleId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    avatar: { 
      type: String 
    },
    provider: { 
      type: String, 
      enum: ['local', 'google'], 
      default: 'local' 
    },
    isEmailVerified: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

const User = mongoose.model('User', userSchema);

export default User;