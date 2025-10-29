import mongoose from "mongoose";

// ✅ Updated Custom Design Schema with proper validation
const customDesignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // Base64 image data
  designData: { type: String, default: "" }, // JSON string of canvas design
  material: {
    type: { type: String, default: "resin" },
    name: { type: String, default: "Resin" },
    description: { type: String, default: "" },
    multiplier: { type: Number, default: 1 }
  },
  size: {
    value: { type: String, default: "4" },
    name: { type: String, default: "4 inch" },
    multiplier: { type: Number, default: 1 }
  },
  pricing: {
    basePrice: { type: Number, default: 299 },
    materialMultiplier: { type: Number, default: 1 },
    sizeMultiplier: { type: Number, default: 1 },
    finalPrice: { type: Number, required: true }
  },
  specifications: {
    material: { type: String, default: "" },
    size: { type: String, default: "" },
    customization: { type: String, default: "Hand-crafted based on your design" },
    processing: { type: String, default: "3-5 business days" }
  }
}, { _id: false }); // Disable _id for subdocument

// ✅ Updated Cart Item Schema with proper conditional validation
const cartItemSchema = new mongoose.Schema({
  // For regular products
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: function() { 
      return !this.isCustomDesign; 
    } 
  },
  
  // For custom designs
  customDesign: {
    type: customDesignSchema,
    required: function() {
      return this.isCustomDesign === true;
    }
  },
  
  isCustomDesign: { type: Boolean, default: false },
  
  // Common fields
  quantity: { type: Number, default: 1, min: 1 },
  specialRequest: { type: String, default: "", maxlength: 500 },
  
  // Custom photo uploaded by user (backward compatibility)
  customPhoto: {
    filePath: { type: String }, // File path in uploads folder
    image: { type: String }, // Base64 encoded image or full URL
    name: { type: String },  // Original filename
    size: { type: Number },  // File size in bytes
    type: { type: String },  // MIME type
    uploadedAt: { type: Date, default: Date.now }
  },
  
  // Multiple photos uploaded by user
  customPhotos: [{
    id: { type: String }, // Frontend generated ID
    image: { type: String }, // Full URL or base64
    preview: { type: String }, // Preview URL if different
    filePath: { type: String }, // Server file path
    name: { type: String }, // Original filename
    size: { type: Number }, // File size in bytes
    type: { type: String }, // MIME type
    order: { type: Number, default: 1 }, // Display order
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Metadata
  addedAt: { type: Date, default: Date.now },
  cartItemId: { type: String } // Unique identifier for frontend
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);
