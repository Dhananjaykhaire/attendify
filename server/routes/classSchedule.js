import express from 'express';
import ClassSchedule from '../models/ClassSchedule.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST api/class-schedules
// @desc    Create a new class schedule
// @access  Private (Admin and Faculty)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create class schedules'
      });
    }

    const {
      name,
      startTime,
      endTime,
      days,
      department,
      faculty,
      students
    } = req.body;

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use 24-hour format (HH:mm)'
      });
    }

    // Validate days
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!days.every(day => validDays.includes(day))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day(s) provided'
      });
    }

    const classSchedule = new ClassSchedule({
      name,
      startTime,
      endTime,
      days,
      department,
      faculty: faculty || req.user.id,
      students
    });

    await classSchedule.save();

    res.status(201).json({
      success: true,
      message: 'Class schedule created successfully',
      classSchedule
    });
  } catch (error) {
    console.error('Create class schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating class schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET api/class-schedules
// @desc    Get all class schedules
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { department, faculty, active } = req.query;
    let query = {};

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by faculty
    if (faculty) {
      query.faculty = faculty;
    }

    // Filter by active status
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    // For students, only show their classes
    if (req.user.role === 'student') {
      query.students = req.user.id;
    }

    // For faculty, show their classes unless they're specifically querying others
    if (req.user.role === 'faculty' && !faculty) {
      query.faculty = req.user.id;
    }

    const classSchedules = await ClassSchedule.find(query)
      .populate('department', 'name')
      .populate('faculty', 'name email')
      .populate('students', 'name email registrationId');

    res.json({
      success: true,
      classSchedules
    });
  } catch (error) {
    console.error('Get class schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class schedules',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET api/class-schedules/:id
// @desc    Get a class schedule by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findById(req.params.id)
      .populate('department', 'name')
      .populate('faculty', 'name email')
      .populate('students', 'name email registrationId');

    if (!classSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Class schedule not found'
      });
    }

    // Check if user has access to this schedule
    const isAdmin = req.user.role === 'admin';
    const isFaculty = req.user.id === classSchedule.faculty._id.toString();
    const isStudent = classSchedule.students.some(student => 
      student._id.toString() === req.user.id
    );

    if (!isAdmin && !isFaculty && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this class schedule'
      });
    }

    res.json({
      success: true,
      classSchedule
    });
  } catch (error) {
    console.error('Get class schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT api/class-schedules/:id
// @desc    Update a class schedule
// @access  Private (Admin and Faculty)
router.put('/:id', auth, async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findById(req.params.id);

    if (!classSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Class schedule not found'
      });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' && 
      classSchedule.faculty.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this class schedule'
      });
    }

    const {
      name,
      startTime,
      endTime,
      days,
      department,
      faculty,
      students,
      isActive
    } = req.body;

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start time format. Please use 24-hour format (HH:mm)'
      });
    }
    if (endTime && !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end time format. Please use 24-hour format (HH:mm)'
      });
    }

    // Validate days if provided
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (days && !days.every(day => validDays.includes(day))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day(s) provided'
      });
    }

    // Update fields
    if (name) classSchedule.name = name;
    if (startTime) classSchedule.startTime = startTime;
    if (endTime) classSchedule.endTime = endTime;
    if (days) classSchedule.days = days;
    if (department) classSchedule.department = department;
    if (faculty) classSchedule.faculty = faculty;
    if (students) classSchedule.students = students;
    if (isActive !== undefined) classSchedule.isActive = isActive;

    await classSchedule.save();

    res.json({
      success: true,
      message: 'Class schedule updated successfully',
      classSchedule
    });
  } catch (error) {
    console.error('Update class schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating class schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE api/class-schedules/:id
// @desc    Delete a class schedule
// @access  Private (Admin and Faculty)
router.delete('/:id', auth, async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findById(req.params.id);

    if (!classSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Class schedule not found'
      });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' && 
      classSchedule.faculty.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this class schedule'
      });
    }

    await classSchedule.remove();

    res.json({
      success: true,
      message: 'Class schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete class schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting class schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET api/class-schedules/current
// @desc    Get currently active classes
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const currentClasses = await ClassSchedule.getCurrentClasses();

    res.json({
      success: true,
      currentClasses
    });
  } catch (error) {
    console.error('Get current classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current classes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; 