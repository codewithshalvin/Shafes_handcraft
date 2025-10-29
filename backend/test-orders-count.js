import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Define minimal Order schema
const orderSchema = new mongoose.Schema({
  orderId: String,
  orderStatus: String,
  paymentStatus: String,
  totalAmount: Number,
  createdAt: Date
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);

// Connect to database
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    try {
      const count = await Order.countDocuments();
      console.log(`📦 Total orders in database: ${count}`);
      
      if (count > 0) {
        const sampleOrders = await Order.find({})
          .limit(3)
          .select('orderId orderStatus paymentStatus totalAmount createdAt')
          .lean();
        
        console.log('\n📋 Sample orders:');
        sampleOrders.forEach(order => {
          console.log(`  - ${order.orderId}: ${order.orderStatus} / ${order.paymentStatus} - ₹${order.totalAmount}`);
        });
      } else {
        console.log('⚠️ No orders found in database. Create some test orders first.');
      }
      
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
