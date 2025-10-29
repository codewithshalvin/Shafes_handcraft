import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mwtcraft', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkUserData() {
  console.log('🔍 Checking user data in database...\n');

  try {
    // Get all users
    const users = await User.find({}).select('name email role isActive createdAt');
    
    console.log(`📊 Found ${users.length} users total:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role || 'undefined'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });

    // Get role counts
    const customerCount = await User.countDocuments({ role: 'customer' });
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });
    const undefinedRoleCount = await User.countDocuments({ role: { $exists: false } });
    const nullRoleCount = await User.countDocuments({ role: null });

    console.log('📈 Role Statistics:');
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Undefined role: ${undefinedRoleCount}`);
    console.log(`   Null role: ${nullRoleCount}`);
    
  } catch (error) {
    console.error('❌ Error checking user data:', error);
  }
}

async function fixUserRoles() {
  console.log('\n🔧 Fixing user roles...\n');

  try {
    // Update users with missing or incorrect roles to 'customer' (unless they're specifically admins)
    const result = await User.updateMany(
      { 
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: '' }
        ]
      },
      { $set: { role: 'customer' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to have 'customer' role`);

    // Fix the user who is incorrectly marked as admin (based on the database output)
    const alinUpdate = await User.updateOne(
      { email: '2312095@nec.edu.in' },
      { $set: { role: 'customer' } }
    );

    if (alinUpdate.modifiedCount > 0) {
      console.log('✅ Updated Alin Maria Vincy (2312095@nec.edu.in) role to customer');
    }
    
    // Also check for the email shown on frontend
    const ajinUpdate = await User.updateOne(
      { email: '2312095@nac.edu.in' },
      { $set: { role: 'customer' } }
    );

    if (ajinUpdate.modifiedCount > 0) {
      console.log('✅ Updated user with @nac.edu.in email to customer');
    } else {
      console.log('⚠️  No user found with email 2312095@nac.edu.in');
    }

  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
  }
}

// Main execution
async function main() {
  await connectDB();
  await checkUserData();
  
  // Fix the roles
  await fixUserRoles();
  await checkUserData(); // Check again after fix
  
  await mongoose.connection.close();
  console.log('📴 Disconnected from MongoDB');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});