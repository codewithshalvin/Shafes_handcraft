import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
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

async function createAdmin() {
  console.log('🔧 Creating admin user...\n');

  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@shafeshandcraft.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create new admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@shafeshandcraft.com',
      password: hashedPassword,
      phone: '+91 9876543210',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      provider: 'local'
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@shafeshandcraft.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');
    console.log('🆔 ID:', adminUser._id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

async function listAllUsers() {
  console.log('\n📋 Current users in database:');
  const users = await User.find({}).select('name email role isActive');
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
  });
  
  console.log(`\n📊 Total: ${users.length} users`);
}

// Main execution
async function main() {
  await connectDB();
  await createAdmin();
  await listAllUsers();
  
  await mongoose.connection.close();
  console.log('\n📴 Disconnected from MongoDB');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});