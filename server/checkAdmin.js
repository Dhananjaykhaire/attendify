import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const mongoURI = "mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend";

async function checkAndUpdateAdmin() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // First check for any user with the admin email
    let adminUser = await User.findOne({ email: 'dhananjay.khaire2004@gmail.com' });
    
    if (adminUser) {
      console.log('User found with admin email:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        hasPassword: !!adminUser.password
      });

      // Update user to be admin if not already
      if (adminUser.role !== 'admin') {
        console.log('Updating user role to admin...');
        adminUser.role = 'admin';
      }

      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      adminUser.password = hashedPassword;
      
      await adminUser.save();
      console.log('Admin user updated successfully');
      
      // Verify the update
      adminUser = await User.findById(adminUser._id);
      console.log('Updated admin user:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        hasPassword: !!adminUser.password
      });
    } else {
      console.log('No user found with admin email, creating new admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        name: 'Admin User',
        email: 'dhananjay.khaire2004@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('New admin user created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAndUpdateAdmin(); 