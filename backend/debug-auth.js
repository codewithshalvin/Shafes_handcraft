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

async function debugAuth() {
  console.log('🔍 Debugging authentication issues...\n');

  try {
    // Check for users with similar emails
    const users = await User.find({
      email: { $regex: '2312095@.*edu.in', $options: 'i' }
    }).select('name email role isActive _id');
    
    console.log(`📧 Found ${users.length} users with email containing "2312095@...edu.in":`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    });

    // Check for exact matches
    const necUser = await User.findOne({ email: '2312095@nec.edu.in' });
    const nacUser = await User.findOne({ email: '2312095@nac.edu.in' });

    console.log('\n🎯 Exact email matches:');
    console.log('2312095@nec.edu.in:', necUser ? `✅ Exists - ID: ${necUser._id}` : '❌ Not found');
    console.log('2312095@nac.edu.in:', nacUser ? `✅ Exists - ID: ${nacUser._id}` : '❌ Not found');

    // If nac user doesn't exist but nec user does, suggest fixing the email
    if (!nacUser && necUser) {
      console.log('\n💡 Suggestion: Update the email from @nec.edu.in to @nac.edu.in');
      
      // Fix the email address to match what the frontend expects:
      const result = await User.updateOne(
        { email: '2312095@nec.edu.in' },
        { $set: { email: '2312095@nac.edu.in' } }
      );
      console.log('✅ Email updated:', result.modifiedCount > 0 ? 'SUCCESS' : 'FAILED');
    }

  } catch (error) {
    console.error('❌ Error debugging auth:', error);
  }
}

// Main execution
async function main() {
  await connectDB();
  await debugAuth();
  
  await mongoose.connection.close();
  console.log('\n📴 Disconnected from MongoDB');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});