import express from "express";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Create admin manually (use once)
router.post("/create", async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: "Admin already exists" });

    const admin = new Admin({ email, password });
    await admin.save();
    res.status(201).json({ message: "Admin created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id }, "your_jwt_secret", { expiresIn: "1d" });
    res.json({ token, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
