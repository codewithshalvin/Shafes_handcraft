import express from 'express';
import Post from '../models/Post.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all posts (for subscribed users)
router.get('/posts', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true })
      .populate('adminId', 'name')
      .sort({ publishDate: -1 })
      .limit(10);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    });
  }
});

// Get single post
router.get('/posts/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isPublished: true })
      .populate('adminId', 'name');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching post'
    });
  }
});

// Like/Unlike post
router.post('/posts/:id/like', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, isPublished: true });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const existingLike = post.likes.find(like => like.userId.toString() === userId.toString());

    if (existingLike) {
      post.likes = post.likes.filter(like => like.userId.toString() !== userId.toString());
      await post.save();
      
      res.json({
        success: true,
        message: 'Post unliked successfully',
        liked: false,
        likeCount: post.likes.length
      });
    } else {
      post.likes.push({ userId });
      await post.save();
      
      res.json({
        success: true,
        message: 'Post liked successfully',
        liked: true,
        likeCount: post.likes.length
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing like'
    });
  }
});

export default router;