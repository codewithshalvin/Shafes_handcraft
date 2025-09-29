import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  category: { type: String, required: true }, // ✅ Reference
  stock: { type: Number, default: 0 },
  description: { type: String },
  
}, { timestamps: true });


export default mongoose.model("Product", productSchema);