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

// Create bootstrap admin only if one does not already exist
userSchema.statics.createDefaultAdmin = async function() {
  try {
    const existingAdmin = await this.findOne({ role: 'admin' });
    if (existingAdmin) {
      return existingAdmin;
    }

    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;
    const name = process.env.DEFAULT_ADMIN_NAME || 'Admin';

    if (!email || !password) {
      console.warn('⚠️ No admin account found and DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD are not set.');
      return null;
    }

    const admin = await this.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true
    });

    console.log(`✅ Default admin created: ${admin.email}`);
    return admin;
  } catch (error) {
    console.error('Error creating default admin:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
