import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { 
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
    content: { 
      type: String, // URL to video/artwork file
      required: false 
    },
    thumbnail: { 
      type: String, // Thumbnail image URL
      required: false 
    },
    type: { 
      type: String, 
      enum: ['video', 'artwork', 'article'], 
      required: true 
    },
    category: { 
      type: String, 
      required: true 
    },
    tags: [{ 
      type: String 
    }],
    isPublished: { 
      type: Boolean, 
      default: false 
    },
    publishDate: { 
      type: Date, 
      default: Date.now 
    },
    views: { 
      type: Number, 
      default: 0 
    },
    duration: { 
      type: Number, // Video duration in seconds
      default: 0 
    },
    likes: [{
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      likedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    comments: [{
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
      },
      content: { 
        type: String, 
        required: true,
        maxlength: 500 
      },
      createdAt: { 
        type: Date, 
        default: Date.now 
      },
      likes: [{
        userId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User' 
        },
        likedAt: { 
          type: Date, 
          default: Date.now 
        }
      }],
      replies: [{
        content: { 
          type: String, 
          required: true,
          maxlength: 500 
        },
        isAdmin: { 
          type: Boolean, 
          default: false 
        },
        adminId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Admin'
        },
        userId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User'
        },
        createdAt: { 
          type: Date, 
          default: Date.now 
        }
      }]
    }],
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin',
      required: true 
    },
    adminId: { 
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

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Index for better query performance
postSchema.index({ publishDate: -1, isPublished: 1 });
postSchema.index({ category: 1, isPublished: 1 });
postSchema.index({ tags: 1, isPublished: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;