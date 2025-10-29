import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Verify JWT token for users
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

// Verify admin JWT token
export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's an admin token (should have isAdmin: true)
    if (!decoded.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    req.adminId = decoded.id;
    next();
  } catch (error) {
    console.error('Admin token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired admin token.' 
    });
  }
};

// Verify user has active subscription
export const verifySubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const subscription = await Subscription.getUserSubscription(req.user._id);
    
    if (!subscription) {
      return res.status(403).json({ 
        success: false, 
        message: 'Active subscription required to access content.' 
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying subscription.' 
    });
  }
};

export default {
  verifyToken,
  verifyAdmin,
  verifySubscription
};