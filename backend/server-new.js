import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Import models
import Post from "./models/Post.js";
import User from "./models/User.js";
import Subscription from "./models/Subscription.js";
import Admin from "./models/Admin.js";

// Import middleware
import { verifyToken, verifyAdmin } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const server = createServer(app);

// ✅ Configure CORS for both Express and Socket.io
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Setup Socket.io with CORS
const io = new Server(server, {
  cors: corsOptions
});

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// ✅ serve uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

// ======================== SOCKET.IO SETUP ========================
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join post room for real-time updates
  socket.on('join-post', (postId) => {
    socket.join(`post-${postId}`);
    console.log(`User ${socket.id} joined post room: post-${postId}`);
  });

  // Leave post room
  socket.on('leave-post', (postId) => {
    socket.leave(`post-${postId}`);
    console.log(`User ${socket.id} left post room: post-${postId}`);
  });

  // Handle real-time like
  socket.on('like-post', async (data) => {
    try {
      const { postId, userId } = data;
      
      // Emit to all users in the post room
      socket.to(`post-${postId}`).emit('post-liked', {
        postId,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Socket like error:', error);
    }
  });

  // Handle real-time comment
  socket.on('new-comment', async (data) => {
    try {
      const { postId, comment } = data;
      
      // Emit to all users in the post room
      socket.to(`post-${postId}`).emit('comment-added', {
        postId,
        comment,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Socket comment error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// ======================== ROUTES ========================

// JWT token generation
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const generateToken = (id, isAdmin = false, expiresIn = '7d') => {
  return jwt.sign({ id, isAdmin }, JWT_SECRET, { expiresIn });
};

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ShafesChannel API is running!',
    timestamp: new Date().toISOString()
  });
});

// User signup
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
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// User login
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
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);
    const subscription = await Subscription.getUserSubscription(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      subscription: subscription ? {
        type: subscription.subscriptionType,
        status: subscription.status
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
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
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

// Get posts
app.get('/api/posts', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ isPublished: true })
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

// Subscribe
app.post('/api/subscribe', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'You are already subscribed'
      });
    }

    const subscription = await Subscription.create({
      userId,
      subscriptionType: 'free',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully',
      subscription: {
        type: subscription.subscriptionType,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription'
    });
  }
});

// Create default admin if none exists
const createDefaultAdmin = async () => {
  try {
    const { default: bcrypt } = await import('bcryptjs');
    const { default: Admin } = await import('./models/Admin.js');
    
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await Admin.create({
        name: 'Admin',
        email: 'admin@shafeschannel.com',
        password: hashedPassword
      });
      
      console.log('✅ Default admin created:', admin.email);
      console.log('🔑 Default password: admin123');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

// ======================== ERROR HANDLING ========================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ======================== START SERVER ========================
server.listen(PORT, async () => {
  console.log(`🚀 ShafesChannel Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:5173`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  
  // Create default admin
  await createDefaultAdmin();
});

export default app;
export { io };