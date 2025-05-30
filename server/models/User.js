import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    required: function() {
      return !this.googleId; // Password is required only if not using Google auth
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student'],
    default: 'student',
    validate: {
      validator: function(v) {
        return ['admin', 'faculty', 'student'].includes(v);
      },
      message: 'Only admin, faculty, and student roles are allowed'
    }
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  registrationId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  faceData: [{
    faceId: String,
    embedding: {
      type: [Number],
      required: true
    },
    confidence: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  profileImage: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create default admin if none exists
userSchema.statics.createDefaultAdmin = async function() {
  try {
    // Delete any existing admin user first
    await this.deleteOne({ email: 'dhananjay.khaire2004@gmail.com' });
    console.log('Cleaned up existing admin user');

    // Create new admin with known password
    const plainPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const admin = await this.create({
      name: 'Admin',
      email: 'dhananjay.khaire2004@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Created new admin user with credentials:');
    console.log('Email:', admin.email);
    console.log('Password:', plainPassword);
    
    return admin;
  } catch (error) {
    console.error('Error creating default admin:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;