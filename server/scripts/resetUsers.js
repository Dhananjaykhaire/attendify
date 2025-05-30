import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const resetUsers = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || "mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend";
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Delete all non-admin users
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`✅ Deleted ${result.deletedCount} non-admin users`);

        // Verify admin still exists
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            console.log('✅ Admin user preserved:', adminUser.email);
        } else {
            console.log('⚠️ No admin user found - creating default admin...');
            await User.createDefaultAdmin();
        }

        console.log('✅ User reset completed successfully');
    } catch (error) {
        console.error('❌ Error resetting users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the reset
resetUsers(); 