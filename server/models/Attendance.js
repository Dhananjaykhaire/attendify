import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['face-recognition', 'proxy'],
    required: true,
    default: 'face-recognition'
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  classSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSchedule'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type === 'proxy';
    }
  },
  faceConfidence: {
    type: Number,
    required: function() {
      return this.type === 'face-recognition';
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for location-based queries
attendanceSchema.index({ location: '2dsphere' });

// Method to get attendance statistics
attendanceSchema.statics.getStats = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          status: '$status',
          type: '$type'
        },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, curr) => {
    const key = `${curr._id.status}_${curr._id.type}`;
    acc[key] = curr.count;
    return acc;
  }, {
    present_face: 0,
    present_proxy: 0,
    absent_face: 0,
    absent_proxy: 0,
    late_face: 0,
    late_proxy: 0
  });
};

// Method to get faculty proxy statistics
attendanceSchema.statics.getFacultyProxyStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        type: 'proxy',
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$markedBy',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'faculty'
      }
    },
    {
      $unwind: '$faculty'
    },
    {
      $project: {
        _id: 1,
        count: 1,
        'faculty.name': 1,
        'faculty.email': 1
      }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;