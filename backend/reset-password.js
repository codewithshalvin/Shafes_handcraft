import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// User Schema (same as in server.js)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    role: { type: String, enum: ['customer', 'admin', 'super_admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    isEmailVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function resetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const userEmail = "2312095@nec.edu.in";
    const newPassword = "password123";

    console.log(`\n🔄 Resetting password for user: ${userEmail}`);
    console.log(`🔑 New password will be: ${newPassword}`);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    const result = await User.updateOne(
      { email: userEmail.toLowerCase() },
      { password: hashedPassword }
    );

    if (result.matchedCount === 0) {
      console.log("❌ No user found with this email");
    } else if (result.modifiedCount === 0) {
      console.log("ℹ️ Password was not changed (might be the same)");
    } else {
      console.log("✅ Password reset successfully!");
      console.log(`🎯 You can now login with email: ${userEmail}`);
      console.log(`🔑 Password: ${newPassword}`);
      
      // Test the new password
      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (user) {
        const isMatch = await bcrypt.compare(newPassword, user.password);
        if (isMatch) {
          console.log("✅ Password verification test passed!");
        } else {
          console.log("❌ Password verification test failed!");
        }
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the password reset
resetPassword();