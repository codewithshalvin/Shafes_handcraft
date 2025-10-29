import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected for debugging"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// Define Order schema (simplified)
const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model("Order", orderSchema);

async function debugOrders() {
  try {
    console.log("🔍 Fetching all orders to analyze photo structure...");
    
    const orders = await Order.find({}).lean();
    console.log(`📦 Found ${orders.length} total orders`);
    
    let ordersWithPhotos = 0;
    
    for (let orderIndex = 0; orderIndex < orders.length; orderIndex++) {
      const order = orders[orderIndex];
      console.log(`\n📋 Order ${orderIndex + 1}: ${order.orderId || order._id}`);
      
      if (order.items && Array.isArray(order.items)) {
        for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
          const item = order.items[itemIndex];
          
          if (item.customPhoto) {
            ordersWithPhotos++;
            console.log(`  📷 Item ${itemIndex + 1} has customPhoto:`, {
              hasCustomPhoto: !!item.customPhoto,
              hasFilePath: !!item.customPhoto.filePath,
              hasImage: !!item.customPhoto.image,
              filePath: item.customPhoto.filePath || 'null',
              imageType: typeof item.customPhoto.image,
              imageStart: item.customPhoto.image ? 
                (item.customPhoto.image.length > 100 ? 
                  item.customPhoto.image.substring(0, 100) + '...' : 
                  item.customPhoto.image) : 'null',
              name: item.customPhoto.name || 'null',
              size: item.customPhoto.size || 'null',
              type: item.customPhoto.type || 'null'
            });
          }
        }
      }
    }
    
    console.log(`\n📊 Summary: ${ordersWithPhotos} orders have custom photos`);
    
  } catch (error) {
    console.error("❌ Error analyzing orders:", error);
  } finally {
    mongoose.connection.close();
  }
}

debugOrders();