import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";
import Product from "./models/Product.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shafeshandcraft";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

async function checkTopProducts() {
  try {
    console.log("\n🔍 Checking orders...");
    const totalOrders = await Order.countDocuments();
    console.log(`📦 Total orders: ${totalOrders}`);
    
    const nonCancelledOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
    console.log(`✅ Non-cancelled orders: ${nonCancelledOrders}`);
    
    // Check sample order items
    console.log("\n📋 Sample order items:");
    const sampleOrders = await Order.find({ status: { $ne: 'cancelled' } }).limit(3);
    sampleOrders.forEach((order, idx) => {
      console.log(`\nOrder ${idx + 1}:`);
      order.items.forEach((item, itemIdx) => {
        console.log(`  Item ${itemIdx + 1}:`);
        console.log(`    Name: ${item.name || 'NO NAME'}`);
        console.log(`    ProductId: ${item.productId}`);
        console.log(`    Quantity: ${item.quantity}`);
        console.log(`    Price: ${item.price}`);
      });
    });
    
    // Run the aggregation
    console.log("\n🔝 Running top products aggregation...");
    const topProducts = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$productDetails.name', 'Unknown Product'] },
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    console.log("\n🏆 Top 10 Products:");
    console.log(JSON.stringify(topProducts, null, 2));
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

checkTopProducts();
