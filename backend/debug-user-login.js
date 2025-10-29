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

async function debugUserLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const testEmail = "2312095@nec.edu.in";
    console.log(`\n🔍 Looking for user with email: ${testEmail}`);

    // Find the user
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    
    if (!user) {
      console.log("❌ User not found!");
      console.log("\n📋 Let's check what users exist:");
      const allUsers = await User.find({}, 'email name createdAt').limit(10);
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));
    } else {
      console.log("✅ User found!");
      console.log("📄 User details:");
      console.log(`  ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Provider: ${user.provider}`);
      console.log(`  Email Verified: ${user.isEmailVerified}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Password Hash: ${user.password.substring(0, 20)}...`);

      // Test password verification with common passwords
      const testPasswords = [
        "password", "123456", "test123", "admin123", "user123",
        "alin123", "maria123", "vincy123", "2312095", "nec123",
        "Password123", "password123", "Password@123", "qwerty", "123123"
      ];
      
      console.log("\n🔐 Testing common passwords...");
      let passwordFound = false;
      for (const testPass of testPasswords) {
        const isMatch = await bcrypt.compare(testPass, user.password);
        if (isMatch) {
          console.log(`✅ Password found: "${testPass}"`);
          passwordFound = true;
          break;
        } else {
          console.log(`❌ Not: "${testPass}"`);
        }
      }
      
      if (!passwordFound) {
        console.log("\n❓ Would you like to reset the password to 'password123'? (y/n)");
        console.log("💡 You can manually run the password reset by uncommenting the code below.");
        
        // Uncomment these lines to reset the password
        /*
        const newPassword = "password123";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updateOne({ _id: user._id }, { password: hashedPassword });
        console.log(`✅ Password reset to: ${newPassword}`);
        */
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the debug
debugUserLogin();