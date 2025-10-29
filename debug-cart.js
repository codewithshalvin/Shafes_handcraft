// Debug cart data for custom photos
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// Cart schema (simplified)
const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  isCustomDesign: { type: Boolean, default: false },
  customDesign: { type: Object },
  quantity: { type: Number, default: 1 },
  specialRequest: { type: String, default: "" },
  customPhoto: {
    filePath: { type: String },
    image: { type: String },
    name: { type: String },
    size: { type: Number },
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  customPhotos: [{ type: Object }],
  addedAt: { type: Date, default: Date.now },
  cartItemId: { type: String }
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

async function checkCartData() {
  try {
    console.log("🔍 Checking cart data for custom photos...");
    
    const cartsWithPhotos = await Cart.find({
      $or: [
        { "items.customPhoto": { $exists: true, $ne: null } },
        { "items.customPhotos": { $exists: true, $ne: [] } }
      ]
    }).populate("items.product", "name price");
    
    console.log(`📦 Found ${cartsWithPhotos.length} cart(s) with custom photos:`);
    
    cartsWithPhotos.forEach((cart, cartIndex) => {
      console.log(`\n🛒 Cart ${cartIndex + 1} (User: ${cart.user}):`);
      
      cart.items.forEach((item, itemIndex) => {
        if (item.customPhoto || (item.customPhotos && item.customPhotos.length > 0)) {
          console.log(`  📋 Item ${itemIndex + 1}: ${item.product?.name || item.customDesign?.name || 'Unknown'}`);
          
          if (item.customPhoto) {
            console.log('    📷 Single customPhoto:');
            console.log('      - filePath:', item.customPhoto.filePath);
            console.log('      - image:', item.customPhoto.image ? item.customPhoto.image.substring(0, 50) + '...' : 'null');
            console.log('      - name:', item.customPhoto.name);
            console.log('      - size:', item.customPhoto.size);
            console.log('      - type:', item.customPhoto.type);
          }
          
          if (item.customPhotos && item.customPhotos.length > 0) {
            console.log('    📸 Multiple customPhotos:', item.customPhotos.length);
            item.customPhotos.forEach((photo, photoIndex) => {
              console.log(`      Photo ${photoIndex + 1}:`);
              console.log('        - filePath:', photo.filePath);
              console.log('        - image:', photo.image ? photo.image.substring(0, 50) + '...' : 'null');
              console.log('        - name:', photo.name);
            });
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking cart data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCartData();