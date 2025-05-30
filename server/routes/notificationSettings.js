import express from 'express';
import { auth } from '../middleware/auth.js';
import NotificationSettings from '../models/NotificationSettings.js';

const router = express.Router();

// Get current user's notification settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = await NotificationSettings.createDefault(req.user.id);
    }
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification settings'
    });
  }
});

// Update notification settings
router.put('/', auth, async (req, res) => {
  try {
    const updates = req.body;
    let settings = await NotificationSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = await NotificationSettings.createDefault(req.user.id);
    }
    
    // Update only allowed fields
    const allowedUpdates = [
      'proxyAttempts',
      'rapidAttempts',
      'locationMismatch',
      'outOfSchedule',
      'lowConfidence',
      'emailDigest'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field]) {
        settings[field] = { ...settings[field], ...updates[field] };
      }
    });
    
    await settings.save();
    
    res.json({
      success: true,
      settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
});

// Reset notification settings to default
router.post('/reset', auth, async (req, res) => {
  try {
    await NotificationSettings.findOneAndDelete({ user: req.user.id });
    const settings = await NotificationSettings.createDefault(req.user.id);
    
    res.json({
      success: true,
      settings,
      message: 'Notification settings reset to default'
    });
  } catch (error) {
    console.error('Error resetting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting notification settings'
    });
  }
});

export default router; 