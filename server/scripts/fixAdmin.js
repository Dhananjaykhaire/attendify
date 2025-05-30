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

const createDefaultAdmin = async () => {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');

    // Define admin user schema (without password hashing middleware)
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean
    });

    const User = mongoose.model('User', userSchema);

    // Hash password once
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'dhananjay.khaire2004@gmail.com' });

    if (adminExists) {
      // Update admin if exists
      adminExists.isActive = true;
      adminExists.role = 'admin';
      adminExists.password = hashedPassword; // Set the hashed password directly
      await adminExists.save();
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin if doesn't exist
      await User.create({
        name: 'Admin',
        email: 'dhananjay.khaire2004@gmail.com',
        password: hashedPassword, // Set the hashed password directly
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created successfully');
    }

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createDefaultAdmin(); 