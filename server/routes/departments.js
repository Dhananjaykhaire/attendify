import express from 'express';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/departments
// @desc    Get all departments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find().populate('head', 'name email');
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error.message);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
});

// @route   GET api/departments/:id/users/count
// @desc    Get count of users in a department
// @access  Private
router.get('/:id/users/count', auth, async (req, res) => {
  try {
    // First check if department exists
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Count users in the department
    const count = await User.countDocuments({ department: req.params.id });
    
    res.json({ count });
  } catch (error) {
    console.error('Get department users count error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid department ID format' });
    }
    res.status(500).json({ message: 'Server error fetching department users count' });
  }
});

// @route   POST api/departments
// @desc    Create a department
// @access  Private/Admin
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, headId } = req.body;
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department already exists' });
    }
    
    // Create new department
    const newDepartment = new Department({
      name,
      description,
      head: headId || null
    });
    
    const department = await newDepartment.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error.message);
    res.status(500).json({ message: 'Server error creating department' });
  }
});

// @route   PUT api/departments/:id
// @desc    Update a department
// @access  Private/Admin
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, headId, isActive } = req.body;
    
    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (headId) updateFields.head = headId;
    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // Update department
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    console.error('Update department error:', error.message);
    res.status(500).json({ message: 'Server error updating department' });
  }
});

// @route   DELETE api/departments/:id
// @desc    Delete a department
// @access  Private/Admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // First check if department exists
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if there are any users in this department
    const usersCount = await User.countDocuments({ department: req.params.id });
    if (usersCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department that has users. Please reassign or delete users first.' 
      });
    }

    // Delete the department
    await Department.findByIdAndDelete(req.params.id);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid department ID format' });
    }
    res.status(500).json({ message: 'Server error deleting department' });
  }
});

export default router;