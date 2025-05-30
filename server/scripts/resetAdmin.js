import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend";

const resetAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get the User model
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean
    }));

    // Delete existing admin user
    await User.deleteOne({ email: 'dhananjay.khaire2004@gmail.com' });
    console.log('Deleted existing admin user');

    // Create new admin with known password
    const plainPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const newAdmin = new User({
      name: 'Admin',
      email: 'dhananjay.khaire2004@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await newAdmin.save();
    console.log('✅ Created new admin user with password:', plainPassword);
    console.log('Email:', newAdmin.email);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin(); 