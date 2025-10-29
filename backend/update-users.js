import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function updateUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Update all users to have default role and isActive if they don't have them
    const result1 = await mongoose.connection.db.collection('users').updateMany(
      { role: { $exists: false } },
      { $set: { role: 'customer' } }
    );
    
    console.log(`✅ Updated ${result1.modifiedCount} users with missing role field`);

    const result2 = await mongoose.connection.db.collection('users').updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${result2.modifiedCount} users with missing isActive field`);

    // Let's also make one user an admin for testing
    const result3 = await mongoose.connection.db.collection('users').updateOne(
      { email: '2312095@nec.edu.in' },
      { $set: { role: 'admin' } }
    );
    
    console.log(`✅ Made user '2312095@nec.edu.in' an admin`);

    // Check final counts
    const totalUsers = await mongoose.connection.db.collection('users').countDocuments();
    const customers = await mongoose.connection.db.collection('users').countDocuments({ role: 'customer' });
    const admins = await mongoose.connection.db.collection('users').countDocuments({ role: { $in: ['admin', 'super_admin'] } });
    
    console.log('\n📊 Final Statistics:');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Customers: ${customers}`);
    console.log(`Admins: ${admins}`);

    await mongoose.disconnect();
    console.log("✅ Database updated successfully!");
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateUsers();