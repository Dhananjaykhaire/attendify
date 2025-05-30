import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sendEmail, emailTemplates } from '../config/email.js';
import PasswordReset from '../models/PasswordReset.js';
import { getPasswordResetEmailTemplate, getPasswordResetSuccessTemplate, getNewUserEmailTemplate } from '../utils/emailTemplates.js';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Helper function to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET || 'FaceRecognition',
    { 
      expiresIn: '24h',  // Access token expires in 24 hours
      algorithm: 'HS256'
    }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      tokenVersion: user.tokenVersion || 0
    },
    process.env.REFRESH_TOKEN_SECRET || 'FaceRecognitionRefresh',
    { 
      expiresIn: '7d' // Refresh token valid for 7 days
    }
  );
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      registrationId: user.registrationId
    },
    process.env.JWT_SECRET || 'FaceRecognition',
    { 
      expiresIn: '24h', // Token expires in 24 hours
      algorithm: 'HS256'
    }
  );
};

// Helper function to generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to check if user is admin or faculty
const checkAdminOrFaculty = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FaceRecognition');
    const user = await User.findById(decoded.id);

    if (!user || !['admin', 'faculty'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin or faculty privileges required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   POST api/auth/register
// @desc    Register a user (requires admin)
// @access  Private/Admin
router.post('/register', checkAdminOrFaculty, async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and password are required' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Password validation
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Validate department if provided
    if (departmentId) {
      const department = await mongoose.model('Department').findById(departmentId);
      if (!department) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'faculty',
      department: departmentId,
      lastLogin: new Date(),
      isActive: true
    });

    await user.save();

    // Send welcome email with credentials
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Face Recognition Attendance System',
        html: getNewUserEmailTemplate(user.name, user.email, password)
      });
      console.log('✅ Welcome email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError);
    }

    // Generate JWT token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'User registration successful! Login credentials have been sent to their email.',
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `A user with this ${field} already exists` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   HEAD/POST api/auth/login
// @desc    Login user
// @access  Public
router.head('/login', (req, res) => {
  res.sendStatus(200); // Just respond with OK for HEAD requests
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password: '****' });

    // Validate request body
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide both email and password' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found:', user ? {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password
    } : 'No');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Log password details for debugging
    console.log('Password check:', {
      providedPassword: password,
      hasStoredPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    console.log('Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Account is deactivated:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Generate new JWT token
    const token = generateToken(user);
    console.log('Login successful for:', email);

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Emit real-time login event
    req.app.get('io').emit('userLogin', {
      userId: user._id,
      name: user.name,
      role: user.role,
      timestamp: new Date()
    });

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'FaceRecognitionRefresh'
    );

    // Find user and check if refresh token matches
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// @route   GET api/auth/protected
// @desc    Test protected route
// @access  Private
router.get('/protected', auth, (req, res) => {
  res.json({
    message: 'You have access to this protected route',
    user: req.user
  });
});

// @route   GET api/auth/verify
// @desc    Verify token and get user data
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        registrationId: user.registrationId,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying token' 
    });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user / Clear credentials
// @access  Private
router.post('/logout', auth, (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const token = PasswordReset.generateToken();
    await PasswordReset.create({
      user: user._id,
      token: token
    });

    // Create reset link using your actual IP address
    const clientURL = process.env.CLIENT_URL || 'http://10.10.42.35:5173';
    const resetLink = `${clientURL}/reset-password/${token}`;

    // Send reset email
    await sendEmail({
      to: user.email,
      ...emailTemplates.resetPassword(resetLink)
    });

    res.json({ 
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending reset email'
    });
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Find valid reset token
    const resetToken = await PasswordReset.findOne({ token });
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await User.findById(resetToken.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = password;
    await user.save();

    // Delete used token
    await PasswordReset.deleteOne({ _id: resetToken._id });

    // Send success email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful',
      html: getPasswordResetSuccessTemplate(user.name)
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// @route   POST api/auth/validate-reset-token/:token
// @desc    Validate reset token
// @access  Public
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find valid reset token
    const resetToken = await PasswordReset.findOne({ token });
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ message: 'Server error validating reset token' });
  }
});

// @route   POST api/auth/test-email
// @desc    Test email configuration
// @access  Public
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Send test email
    await sendEmail({
      to: email,
      subject: 'Test Email - Face Recognition System',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your SMTP configuration.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `
    });

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('department', 'name');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        registrationId: user.registrationId,
        lastLogin: user.lastLogin,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user information' 
    });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // You can generate a JWT here and redirect to your frontend with the token
    // Example: res.redirect(`http://localhost:5173?token=${jwt}`);
    res.redirect('https://yourdomain.com/api/auth/google/callback'); // For demo
  }
);

// Replace with your Google credentials
passport.use(new GoogleStrategy({
  clientID: 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user in your DB here
  // Example:
  // let user = await User.findOne({ googleId: profile.id });
  // if (!user) user = await User.create({ ... });
  // return done(null, user);
  return done(null, profile); // For demo only
}));

// Serialize/deserialize user (for session, or you can use JWT)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

export default router;