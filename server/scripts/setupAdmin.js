import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Connection
const mongoURI = "mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend";

const setupAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Define the complete user schema
    const userSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
      },
      password: {
        type: String,
        required: true,
        minlength: 6
      },
      role: {
        type: String,
        enum: ['admin', 'faculty'],
        default: 'faculty'
      },
      lastActive: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      },
      profileImage: {
        type: String,
        default: null
      },
      faceData: [{
        imageId: String,
        imageUrl: String,
        imageKit_id: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }]
    }, {
      timestamps: true
    });

    // Add password comparison method
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Delete existing admin
    await User.deleteOne({ email: 'dhananjay.khaire2004@gmail.com' });
    console.log('Cleaned up existing admin user');

    // Create password hash
    const plainPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create new admin with all required fields
    const admin = new User({
      name: 'Admin',
      email: 'dhananjay.khaire2004@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      lastActive: new Date(),
      profileImage: null,
      faceData: []
    });

    await admin.save();

    // Verify the admin can log in
    const loginTest = await admin.comparePassword(plainPassword);
    console.log('Password verification test:', loginTest ? 'PASSED' : 'FAILED');

    console.log('✅ Admin user created successfully');
    console.log('Email:', admin.email);
    console.log('Password:', plainPassword);
    console.log('Admin user ID:', admin._id);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

setupAdmin(); 