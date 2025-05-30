import express from 'express';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
import imagekit from '../utils/imagekit.js';
import Attendance from '../models/Attendance.js';
import path from 'path';
import fs from 'fs';
import imagekitService from '../utils/imagekit.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for handling file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Please upload an image file'));
    }
    cb(null, true);
  }
});

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('Fetching all users...');
    const users = await User.find().select('-password').populate('department', 'name');
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Fetching user by ID:', req.params.id);
    const user = await User.findById(req.params.id).select('-password').populate('department', 'name');
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Found user:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Updating user:', req.params.id);
    console.log('Update data:', req.body);
    
    const { name, email, role, departmentId, registrationId } = req.body;

    // Build user object
    const userFields = {};
    if (name) userFields.name = name.trim();
    if (email) userFields.email = email.toLowerCase().trim();
    if (role) userFields.role = role;
    if (departmentId) userFields.department = departmentId;
    if (registrationId) userFields.registrationId = registrationId.trim();

    console.log('Processed update fields:', userFields);

    // Check if user exists
    let user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        console.log('Email already exists:', email);
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Check if registrationId is being changed and if it's already taken
    if (registrationId && registrationId !== user.registrationId) {
      const existingUser = await User.findOne({ registrationId });
      if (existingUser) {
        console.log('Registration ID already exists:', registrationId);
        return res.status(400).json({ message: 'Registration ID already exists' });
      }
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password').populate('department', 'name');

    console.log('User updated successfully:', user.name);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ 
      message: 'Server error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST api/users/face
// @desc    Register face data for a user
// @access  Private
router.post('/face', auth, async (req, res) => {
  try {
    const { base64Image, faceEmbedding, confidence } = req.body;
    const userId = req.user.id;
    
    if (!faceEmbedding) {
      return res.status(400).json({ 
        success: false,
        message: 'Face embedding data is required' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user has reached maximum face registrations (5)
    if (user.faceData && user.faceData.length >= 5) {
      return res.status(400).json({ 
        success: false,
        message: 'Maximum number of face registrations reached (5)' 
      });
    }
    
    // Add face data to user
    const newFaceData = {
      faceId: `face_${userId}_${Date.now()}`,
      embedding: faceEmbedding,
      confidence: confidence,
      createdAt: new Date()
    };
    
    user.faceData = user.faceData || [];
    user.faceData.push(newFaceData);
    await user.save();

    // Emit real-time update
    req.app.get('io').emit('faceRegistration', {
      userId: user._id,
      name: user.name,
      faceCount: user.faceData.length,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true,
      message: 'Face registered successfully',
      faceData: user.faceData.map(face => ({
        faceId: face.faceId,
        confidence: face.confidence,
        createdAt: face.createdAt
      }))
    });
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error registering face',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE api/users/face/:imageId
// @desc    Delete face data
// @access  Private
router.delete('/face/:imageId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Find the face data
    const faceDataIndex = user.faceData.findIndex(
      data => data.imageId === req.params.imageId
    );
    
    if (faceDataIndex === -1) {
      return res.status(404).json({ message: 'Face data not found' });
    }
    
    // Delete from ImageKit
    await imagekit.deleteFile(user.faceData[faceDataIndex].imageKit_id);
    
    // Remove from user document
    user.faceData.splice(faceDataIndex, 1);
    await user.save();
    
    res.json({ message: 'Face data deleted successfully' });
  } catch (error) {
    console.error('Delete face data error:', error.message);
    res.status(500).json({ message: 'Server error deleting face data' });
  }
});

// @route   PUT api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Attempting to delete user:', req.params.id);

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's face data from ImageKit if any
    if (user.faceData && user.faceData.length > 0) {
      console.log('Deleting face data from ImageKit...');
      for (const face of user.faceData) {
        try {
          await imagekit.deleteFile(face.imageKit_id);
        } catch (error) {
          console.error('Error deleting face data from ImageKit:', error);
          // Continue with user deletion even if face data deletion fails
        }
      }
    }

    // Delete user's attendance records
    console.log('Deleting user attendance records...');
    await Attendance.deleteMany({ user: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    console.log('User deleted successfully');

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ 
      message: 'Server error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const { name } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (name) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long'
        });
      }
      user.name = name.trim();
    }

    // Handle profile image if provided
    if (req.file) {
      try {
        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
          file: req.file.buffer,
          fileName: `profile_${user._id}_${Date.now()}`,
          folder: '/profile-images/'
        });
        
        // Delete old profile image if exists
        if (user.profileImage) {
          try {
            const fileId = user.profileImage.split('/').pop();
            await imagekit.deleteFile(fileId);
          } catch (deleteError) {
            console.error('Error deleting old profile image:', deleteError);
          }
        }
        
        user.profileImage = uploadResponse.url;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile image'
        });
      }
    }

    await user.save();
    
    // Return user data without sensitive information
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      registrationId: user.registrationId,
      profileImage: user.profileImage
    };
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'MulterError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST api/users/reset
// @desc    Reset all non-admin users
// @access  Private/Admin
router.post('/reset', adminAuth, async (req, res) => {
    try {
        // Delete all non-admin users
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        
        console.log(`Reset users: Deleted ${result.deletedCount} non-admin users`);
        
        res.json({ 
            success: true,
            message: `Successfully deleted ${result.deletedCount} non-admin users`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Reset users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error resetting users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
  }
});

// @route   GET api/users/faculty
// @desc    Get all faculty users
// @access  Private (Admin or Faculty)
router.get('/faculty', auth, async (req, res) => {
  try {
    // Check if user is admin or faculty
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view faculty list' });
    }

    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .populate('department', 'name');
    
    res.json({ users: faculty });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ message: 'Server error fetching faculty' });
  }
});

export default router;