import mongoose from 'mongoose';

const classScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String, // Format: "HH:mm" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:mm" (24-hour)
    required: true
  },
  days: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Method to check if current time is within class schedule
classScheduleSchema.methods.isWithinSchedule = function(date = new Date()) {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' });
  if (!this.days.includes(day)) return false;

  const currentTime = date.toLocaleTimeString('en-US', { hour12: false });
  return currentTime >= this.startTime && currentTime <= this.endTime;
};

// Method to get active classes for current time
classScheduleSchema.statics.getCurrentClasses = async function(date = new Date()) {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = date.toLocaleTimeString('en-US', { hour12: false });

  return this.find({
    days: day,
    startTime: { $lte: currentTime },
    endTime: { $gte: currentTime },
    isActive: true
  }).populate('department faculty');
};

export default mongoose.model('ClassSchedule', classScheduleSchema); 