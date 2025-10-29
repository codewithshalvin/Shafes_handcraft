import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 200 
    },
    description: { 
      type: String, 
      required: true, 
      maxlength: 2000 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    costPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    category: { 
      type: String, 
      required: true,
      enum: ['handcraft', 'artwork', 'jewelry', 'pottery', 'textiles', 'woodwork', 'other']
    },
    images: [{ 
      type: String // URLs to product images
    }],
    stock: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    featured: { 
      type: Boolean, 
      default: false 
    },
    tags: [{ 
      type: String 
    }],
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, default: 'cm' }
    },
    weight: {
      value: { type: Number },
      unit: { type: String, default: 'kg' }
    },
    materials: [{ 
      type: String 
    }],
    craftingTime: { 
      type: Number, // in hours
      default: 0 
    },
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'], 
      default: 'intermediate' 
    },
    views: { 
      type: Number, 
      default: 0 
    },
    totalSold: { 
      type: Number, 
      default: 0 
    },
    ratings: [{
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      rating: { 
        type: Number, 
        min: 1, 
        max: 5 
      },
      review: { 
        type: String, 
        maxlength: 500 
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
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

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return (sum / this.ratings.length).toFixed(1);
});

// Virtual for total reviews
productSchema.virtual('totalReviews').get(function() {
  return this.ratings.length;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.price - this.costPrice) / this.price * 100).toFixed(2);
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ featured: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;