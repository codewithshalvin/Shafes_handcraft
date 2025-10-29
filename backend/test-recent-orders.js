import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shafeshandcraft";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

async function testRecentOrders() {
  try {
    console.log("\n📋 Testing Recent Orders Query...\n");
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'firstName lastName email')
      .select('orderNumber orderId totalAmount orderStatus paymentStatus shippingAddress createdAt')
      .lean();
    
    console.log(`Found ${recentOrders.length} recent orders:\n`);
    
    recentOrders.forEach((order, idx) => {
      console.log(`${idx + 1}. Order ID: ${order.orderNumber || order.orderId}`);
      console.log(`   Customer: ${order.shippingAddress?.name || 'N/A'}`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Payment: ${order.paymentStatus}`);
      console.log(`   Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
      console.log(`   User populated: ${order.user ? 'Yes' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

testRecentOrders();
