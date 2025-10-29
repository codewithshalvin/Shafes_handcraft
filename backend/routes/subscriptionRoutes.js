import express from 'express';
import Subscription from '../models/Subscription.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Subscribe user to channel
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const existingSubscription = await Subscription.findOne({ userId });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'You are already subscribed'
        });
      } else {
        existingSubscription.status = 'active';
        existingSubscription.subscriptionDate = new Date();
        await existingSubscription.save();

        return res.json({
          success: true,
          message: 'Subscription reactivated successfully',
          subscription: {
            type: existingSubscription.subscriptionType,
            status: existingSubscription.status,
            subscriptionDate: existingSubscription.subscriptionDate
          }
        });
      }
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
        status: subscription.status,
        subscriptionDate: subscription.subscriptionDate
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

// Get user's subscription status
router.get('/subscription/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const subscription = await Subscription.getUserSubscription(userId);

    if (!subscription) {
      return res.json({
        success: true,
        subscribed: false,
        subscription: null
      });
    }

    res.json({
      success: true,
      subscribed: true,
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

export default router;