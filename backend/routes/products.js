import express from "express";
import Product from "../models/Products.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// POST new product (with image)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      description: req.body.description,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });
    console.log(newProduct);

    const saved = await newProduct.save();
    console.log(saved);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

export default router;
