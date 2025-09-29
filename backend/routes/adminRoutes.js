import express from "express";
import Admin from "../models/Admin.js";

const router = express.Router();

// Admin Signup
router.post("/admin/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // save new admin (password hashed automatically)
    const admin = new Admin({ email, password });
    await admin.save();

    res.json({ message: "✅ Admin registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
