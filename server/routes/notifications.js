import express from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';
import ClassSchedule from '../models/ClassSchedule.js';

const router = express.Router();

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
});

// Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Emit socket event
    req.app.get('io').emit('notificationRead', {
      notificationId: notification._id
    });

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    // Emit socket event
    req.app.get('io').emit('allNotificationsRead', {
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read'
    });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
});

// @route   POST api/notifications/leave-notice
// @desc    Create a leave notice for a class
// @access  Private (Faculty only)
router.post('/leave-notice', auth, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty members can create leave notices'
      });
    }

    const { classScheduleId, message, date } = req.body;

    // Validate request data
    if (!classScheduleId || !message || !date) {
      return res.status(400).json({
        success: false,
        message: 'Class schedule ID, message, and date are required'
      });
    }

    // Get the class schedule
    const classSchedule = await ClassSchedule.findById(classScheduleId)
      .populate('students', 'name');

    if (!classSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Class schedule not found'
      });
    }

    // Verify that the faculty member is assigned to this class
    if (classSchedule.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create leave notices for this class'
      });
    }

    // Create notifications for all students in the class
    const notifications = classSchedule.students.map(student => ({
      title: 'Faculty Leave Notice',
      message: `${req.user.name} will be on leave for ${classSchedule.name} on ${new Date(date).toLocaleDateString()}. ${message}`,
      type: 'leave_notice',
      recipient: student._id,
      sender: req.user.id,
      relatedClass: classScheduleId
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: 'Leave notice sent to all students'
    });
  } catch (error) {
    console.error('Error creating leave notice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave notice'
    });
  }
});

export default router; 