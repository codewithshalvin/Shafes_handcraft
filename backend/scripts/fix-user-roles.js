import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// Define User schema (same as in server.js)
const userSchema = new mongoose.Schema({
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
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function fixUserRoles() {
  try {
    console.log("🔍 Checking existing users...");
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    let updatedCount = 0;
    
    for (let user of users) {
      const updates = {};
      
      // Set default role if missing
      if (!user.role) {
        updates.role = 'customer';
      }
      
      // Set default isActive if missing
      if (user.isActive === undefined || user.isActive === null) {
        updates.isActive = true;
      }
      
      // Update the user if needed
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`✅ Updated user ${user.email}:`, updates);
        updatedCount++;
      } else {
        console.log(`✅ User ${user.email} already has proper fields`);
      }
    }
    
    console.log(`\n🎉 Migration complete! Updated ${updatedCount} users.`);
    
    // Show final stats
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const admins = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    console.log('\n📊 Final Statistics:');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Customers: ${customers}`);
    console.log(`Admins: ${admins}`);
    console.log(`Active Users: ${activeUsers}`);
    
    // Create a sample admin user if none exists
    if (admins === 0) {
      console.log('\n👑 No admin users found. Creating a sample admin...');
      
      // Check if there's a user we can promote
      const firstUser = await User.findOne({ role: 'customer' });
      if (firstUser) {
        await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
        console.log(`✅ Promoted ${firstUser.email} to admin role`);
      }
    }
    
    mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Run the migration
fixUserRoles();