import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Connection
const mongoURI = "mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend";

const updateAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Define a simple user schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Create password hash
    const plainPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Update or create admin user
    const result = await User.findOneAndUpdate(
      { email: 'dhananjay.khaire2004@gmail.com' },
      {
        $set: {
          name: 'Admin',
          password: hashedPassword,
          role: 'admin',
          isActive: true
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Admin user updated successfully');
    console.log('Email:', result.email);
    console.log('Password:', plainPassword);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateAdmin(); 