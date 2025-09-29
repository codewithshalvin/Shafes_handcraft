import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryname: { type: String, required: true },
    image: { type: String, required: false }, // 👈 this is the missing part
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
