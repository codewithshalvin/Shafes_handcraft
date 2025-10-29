import mongoose from 'mongoose';
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

async function fixUserEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const oldEmail = "2312095@nac.edu.in";
    const newEmail = "2312095@nec.edu.in";

    console.log(`\n🔄 Updating email from ${oldEmail} to ${newEmail}`);

    // Find and update the user
    const result = await User.updateOne(
      { email: oldEmail.toLowerCase() },
      { email: newEmail.toLowerCase() }
    );

    if (result.matchedCount === 0) {
      console.log("❌ No user found with the old email");
    } else if (result.modifiedCount === 0) {
      console.log("ℹ️ Email was already up to date");
    } else {
      console.log("✅ Email updated successfully!");
      
      // Verify the update
      const updatedUser = await User.findOne({ email: newEmail.toLowerCase() });
      if (updatedUser) {
        console.log(`✅ Verified: User now has email ${updatedUser.email}`);
      }
    }

  } catch (error) {
    if (error.code === 11000) {
      console.error("❌ Error: A user with the new email already exists");
    } else {
      console.error("❌ Error:", error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the fix
fixUserEmail();