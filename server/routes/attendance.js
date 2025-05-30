import express from 'express';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import ClassSchedule from '../models/ClassSchedule.js';
import Notification from '../models/Notification.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { validateAttendanceNetwork } from '../middleware/networkValidation.js';
import imagekit from '../utils/imagekit.js';
import { Parser } from 'json2csv';

const router = express.Router();

// @route   POST api/attendance/mark
// @desc    Mark attendance with face recognition
// @access  Private
router.post('/mark', auth, async (req, res) => {
  try {
    const { faceEmbedding, confidence, type } = req.body;
    const userId = req.user.id;
    
    // Validate request data
    if (!faceEmbedding) {
      return res.status(400).json({ 
        success: false,
        message: 'Face embedding data is required' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check for duplicate attendance in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingAttendance = await Attendance.findOne({
      user: userId,
      timestamp: { $gt: fiveMinutesAgo }
    });

    if (existingAttendance) {
        // Create notification for rapid attendance attempts
        const notification = new Notification({
          title: 'Suspicious Rapid Attendance',
          message: `${user.name} attempted to mark attendance multiple times within 5 minutes`,
          type: 'proxy_attempt',
          recipient: userClasses[0]?.faculty, // Faculty of the first active class
          sender: userId,
          relatedStudent: userId
        });
        await notification.save();

        return res.status(400).json({
          success: false,
          message: 'Attendance already marked in the last 5 minutes' 
        });
    }

    // Get current active classes for the user
    const currentClasses = await ClassSchedule.getCurrentClasses();
    const userClasses = currentClasses.filter(cls => 
      cls.students.some(student => student.toString() === userId)
    );

    if (userClasses.length === 0) {
      // Create notification for proxy attempt
      const notification = new Notification({
        title: 'Proxy Attendance Attempt',
        message: `${user.name} attempted to mark attendance without any active classes`,
        type: 'proxy_attempt',
        recipient: user.department, // Department head/admin
        sender: userId,
        relatedStudent: userId
      });
      await notification.save();

      return res.status(400).json({
        success: false,
        message: 'No active classes found for current time'
      });
    }

    // Get current location
    const clientLocation = req.locationInfo?.geo?.ll || [0, 0];
    
    // Check if student is within class location radius (assuming class has location)
    for (const classSchedule of userClasses) {
      if (classSchedule.location) {
        const distance = calculateDistance(
          clientLocation[0], 
          clientLocation[1],
          classSchedule.location.coordinates[0],
          classSchedule.location.coordinates[1]
        );

        // If student is too far from class location (e.g., > 100 meters)
        if (distance > 100) {
          // Create notification for location mismatch
          const notification = new Notification({
            title: 'Location Mismatch Alert',
            message: `${user.name} attempted to mark attendance ${Math.round(distance)}m away from class location`,
            type: 'proxy_attempt',
            recipient: classSchedule.faculty,
            sender: userId,
            relatedClass: classSchedule._id,
            relatedStudent: userId
          });
          await notification.save();
        }
      }
    }

    // Get current location (using a default location if not available)
    const defaultLocation = {
      type: 'Point',
      coordinates: [0, 0] // Default coordinates
    };

    // Create attendance records for each active class
    const attendanceRecords = [];
    for (const classSchedule of userClasses) {
      // Determine if student is late based on class start time
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      const isLate = currentTime > classSchedule.startTime;

      const attendance = new Attendance({
        user: userId,
        date: new Date(),
        type: 'face-recognition',
        timestamp: new Date(),
        faceConfidence: confidence * 100,
        status: isLate ? 'late' : 'present',
        classSchedule: classSchedule._id,
        faceEmbedding: faceEmbedding,
        location: defaultLocation
      });

      attendanceRecords.push(attendance);

      // Create notification for late attendance
      if (isLate) {
        const notification = new Notification({
          title: 'Late Attendance',
          message: `${user.name} marked late attendance for ${classSchedule.name}`,
          type: 'late_attendance',
          recipient: classSchedule.faculty, // Faculty teaching the class
          sender: userId,
          relatedClass: classSchedule._id,
          relatedStudent: userId
        });
        await notification.save();
      }
    }

    // Save all attendance records
    await Attendance.insertMany(attendanceRecords);

    // Emit real-time update through Socket.io
    const io = req.app.get('io');
    if (io) {
      attendanceRecords.forEach(attendance => {
        io.emit('attendanceUpdate', {
          userId,
          type: attendance.type,
          timestamp: attendance.timestamp,
          status: attendance.status,
          classSchedule: attendance.classSchedule
        });
      });
    }

    res.status(201).json({
      success: true,
      message: `Attendance marked successfully for ${attendanceRecords.length} classes`,
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET api/attendance/me
// @desc    Get current user's attendance
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit, page } = req.query;
    
    let dateFilter = { user: req.user.id };
    
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Pagination
    const pageSize = parseInt(limit) || 20;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageSize;
    
    const totalRecords = await Attendance.countDocuments(dateFilter);
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    const attendance = await Attendance.find(dateFilter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);
    
    res.json({
      records: attendance,
      pagination: {
        total: totalRecords,
        pages: totalPages,
        page: currentPage,
        pageSize
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error.message);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// @route   GET api/attendance/stats
// @desc    Get attendance statistics for the current user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = { user: req.user.id };
    
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const allAttendance = await Attendance.find(dateFilter);
    
    // Calculate statistics
    const totalRecords = allAttendance.length;
    const presentCount = allAttendance.filter(a => a.status === 'present').length;
    const lateCount = allAttendance.filter(a => a.status === 'late').length;
    const absentCount = allAttendance.filter(a => a.status === 'absent').length;
    const halfDayCount = allAttendance.filter(a => a.status === 'half-day').length;
    
    // Calculate average hours worked
    const recordsWithHours = allAttendance.filter(a => a.hoursWorked);
    const totalHours = recordsWithHours.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    const averageHours = recordsWithHours.length ? (totalHours / recordsWithHours.length).toFixed(2) : 0;
    
    // Calculate streak (consecutive days with attendance)
    let currentStreak = 0;
    if (allAttendance.length > 0) {
      // Sort by date in ascending order
      const sortedAttendance = [...allAttendance].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Find consecutive days
      let streak = 1;
      for (let i = 1; i < sortedAttendance.length; i++) {
        const prevDate = new Date(sortedAttendance[i-1].date);
        const currDate = new Date(sortedAttendance[i].date);
        
        // Check if dates are consecutive
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
        } else {
          streak = 1; // Reset streak if days are not consecutive
        }
      }
      currentStreak = streak;
    }
    
    res.json({
      totalDays: totalRecords,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      halfDay: halfDayCount,
      presentPercentage: totalRecords ? ((presentCount / totalRecords) * 100).toFixed(2) : 0,
      latePercentage: totalRecords ? ((lateCount / totalRecords) * 100).toFixed(2) : 0,
      absentPercentage: totalRecords ? ((absentCount / totalRecords) * 100).toFixed(2) : 0,
      averageHoursWorked: averageHours,
      currentStreak
    });
  } catch (error) {
    console.error('Get attendance stats error:', error.message);
    res.status(500).json({ message: 'Server error fetching attendance statistics' });
  }
});

// @route   GET api/attendance
// @desc    Get attendance records with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 20, page = 1, userId } = req.query;
    
    // Build query filter
    let filter = {};
    
    // Add date range filter if provided
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add user filter
    if (userId) {
      // If specific user is requested and requester is admin or faculty
      filter.userId = userId;
    } else if (req.user.role !== 'admin') {
      // If no specific user and requester is not admin, show only their records
      filter.userId = req.user.id;
    }
    
    // Pagination setup
    const pageSize = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageSize;
    
    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    // Get records with pagination
    const records = await Attendance.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('userId', 'name email');

    // Calculate statistics
    const stats = {
      total: totalRecords,
      present: await Attendance.countDocuments({ ...filter, status: 'present' }),
      late: await Attendance.countDocuments({ ...filter, status: 'late' }),
      absent: await Attendance.countDocuments({ ...filter, status: 'absent' })
    };
    
    res.json({
      success: true,
      data: {
        records,
        stats,
        pagination: {
          total: totalRecords,
          pages: totalPages,
          currentPage: parseInt(page),
          pageSize
        }
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH api/attendance/:id/verify
// @desc    Verify attendance record
// @access  Private (Admin and Faculty)
router.patch('/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({
        message: 'Not authorized to verify attendance'
      });
    }
    
    const { type } = req.body;
    if (!type || !['checkIn', 'checkOut'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid verification type'
      });
    }
    
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        message: 'Attendance record not found'
      });
    }
    
    // Update verification status
    attendance[type].verified = true;
    attendance[type].verifiedBy = req.user.id;
    attendance[type].verifiedAt = new Date();
    
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    console.error('Error verifying attendance:', error);
    res.status(500).json({
      message: 'Server error verifying attendance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH api/attendance/:id/reject
// @desc    Reject attendance check-in or check-out (admin only)
// @access  Private/Admin
router.patch('/:id/reject', adminAuth, async (req, res) => {
  try {
    const { type } = req.body; // type can be 'checkIn' or 'checkOut'
    
    if (!type || (type !== 'checkIn' && type !== 'checkOut')) {
      return res.status(400).json({ message: 'Invalid rejection type' });
    }
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Check if the type exists on the record
    if (!attendance[type] || !attendance[type].time) {
      return res.status(400).json({ message: `No ${type === 'checkIn' ? 'check-in' : 'check-out'} record found` });
    }
    
    // If rejecting check-in on a record with check-out, clear both
    if (type === 'checkIn' && attendance.checkOut.time) {
      attendance.checkOut = {};
    }
    
    // Reset the specified field
    attendance[type] = {};
    attendance.verifiedBy = req.user.id;
    
    // If check-in was rejected and this is the only record for the day, set status to absent
    if (type === 'checkIn' && !attendance.checkOut.time) {
      attendance.status = 'absent';
    }
    
    await attendance.save();
    
    res.json({
      message: `${type === 'checkIn' ? 'Check-in' : 'Check-out'} rejected successfully`,
      attendance
    });
  } catch (error) {
    console.error(`Error rejecting attendance:`, error.message);
    res.status(500).json({ message: 'Server error rejecting attendance' });
  }
});

// @route   PUT api/attendance/:id
// @desc    Update attendance record (admin only)
// @access  Private/Admin
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status, notes, checkInVerified, checkOutVerified, checkInTime, checkOutTime } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Update verification status
    if (checkInVerified !== undefined && attendance.checkIn) {
      attendance.checkIn.verified = checkInVerified;
    }
    
    if (checkOutVerified !== undefined && attendance.checkOut) {
      attendance.checkOut.verified = checkOutVerified;
    }
    
    // Update check-in/out times
    if (checkInTime && attendance.checkIn) {
      attendance.checkIn.time = new Date(checkInTime);
    }
    
    if (checkOutTime && attendance.checkOut) {
      attendance.checkOut.time = new Date(checkOutTime);
    }
    
    // Calculate hours worked if both check-in and check-out are available
    if (attendance.checkIn?.time && attendance.checkOut?.time) {
      const checkInTime = new Date(attendance.checkIn.time);
      const checkOutTime = new Date(attendance.checkOut.time);
      const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      attendance.hoursWorked = parseFloat(hoursWorked.toFixed(2));
    }
    
    // Update other fields
    if (status) attendance.status = status;
    if (notes) attendance.notes = notes;
    
    attendance.verifiedBy = req.user.id;
    
    await attendance.save();
    
    res.json({
      message: 'Attendance record updated',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error.message);
    res.status(500).json({ message: 'Server error updating attendance' });
  }
});

// @route   GET api/attendance/export
// @desc    Export attendance records to CSV
// @access  Private (Admin and Faculty)
router.get('/export', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export attendance'
      });
    }
    
    const { startDate, endDate, department } = req.query;
    
    // Build query
    let query = {};
    
    // Add date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Add department filter if specified
    if (department) {
      const users = await User.find({ department }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }
    
    // Add user filter if not admin
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }
    
    const attendance = await Attendance.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: 1 });
    
    // Prepare CSV data
    const fields = [
      'Date',
      'Time',
      'Name',
      'Email',
      'Type',
      'Status',
      'Face Confidence',
      'Location'
    ];
    
    const data = attendance.map(record => ({
      'Date': record.timestamp.toLocaleDateString(),
      'Time': record.timestamp.toLocaleTimeString(),
      'Name': record.userId?.name || 'N/A',
      'Email': record.userId?.email || 'N/A',
      'Type': record.type || 'N/A',
      'Status': record.status || 'N/A',
      'Face Confidence': record.faceConfidence ? `${record.faceConfidence.toFixed(2)}%` : 'N/A',
      'Location': record.location?.coordinates?.join(', ') || 'N/A'
    }));
    
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    
    // Set response headers for CSV download
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename=attendance_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE api/attendance/:id
// @desc    Delete an attendance record (admin only)
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    await attendance.remove();
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error.message);
    res.status(500).json({ message: 'Server error deleting attendance' });
  }
});

// @route   POST api/attendance/proxy
// @desc    Mark proxy attendance for users
// @access  Private/Faculty
router.post('/proxy', auth, async (req, res) => {
  try {
    // Check if user is faculty
    if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only faculty members can mark proxy attendance' 
      });
    }

    const { users, date, status, location, notes } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one user'
      });
    }

    // Validate date
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Create attendance records for each user
    const attendanceRecords = [];
    for (const userId of users) {
      const attendance = new Attendance({
        user: userId,
        date: attendanceDate,
        type: 'proxy',
        status: status || 'present',
        markedBy: req.user.id,
        location: location || { coordinates: [0, 0] },
        notes: notes || `Proxy attendance marked by ${req.user.name}`
      });
      attendanceRecords.push(attendance);
    }

    // Save all attendance records
    await Attendance.insertMany(attendanceRecords);

    res.json({
      success: true,
      message: `Proxy attendance marked for ${users.length} users`,
      count: users.length
    });
  } catch (error) {
    console.error('Proxy attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking proxy attendance'
    });
  }
});

// @route   GET api/attendance/proxy/stats
// @desc    Get proxy attendance statistics
// @access  Private/Admin
router.get('/proxy/stats', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide start and end dates'
      });
    }

    const stats = await Attendance.getFacultyProxyStats(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Proxy stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching proxy attendance statistics'
    });
  }
});

export default router;