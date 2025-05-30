import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proxyAttempts: {
    enabled: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: true },
    distanceThreshold: { type: Number, default: 100 }, // meters
    notifyDepartmentHead: { type: Boolean, default: true }
  },
  rapidAttempts: {
    enabled: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: true },
    timeWindow: { type: Number, default: 5 }, // minutes
    attemptsThreshold: { type: Number, default: 2 }
  },
  locationMismatch: {
    enabled: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: true },
    distanceThreshold: { type: Number, default: 100 } // meters
  },
  outOfSchedule: {
    enabled: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: true }
  },
  lowConfidence: {
    enabled: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: false },
    confidenceThreshold: { type: Number, default: 0.85 }
  },
  emailDigest: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ['never', 'daily', 'weekly'], default: 'daily' },
    time: { type: String, default: '18:00' } // Time for daily digest
  }
}, {
  timestamps: true
});

// Create default settings for new user
notificationSettingsSchema.statics.createDefault = async function(userId) {
  return this.create({
    user: userId,
    proxyAttempts: {
      enabled: true,
      emailNotification: true,
      distanceThreshold: 100,
      notifyDepartmentHead: true
    },
    rapidAttempts: {
      enabled: true,
      emailNotification: true,
      timeWindow: 5,
      attemptsThreshold: 2
    },
    locationMismatch: {
      enabled: true,
      emailNotification: true,
      distanceThreshold: 100
    },
    outOfSchedule: {
      enabled: true,
      emailNotification: true
    },
    lowConfidence: {
      enabled: true,
      emailNotification: false,
      confidenceThreshold: 0.85
    },
    emailDigest: {
      enabled: true,
      frequency: 'daily',
      time: '18:00'
    }
  });
};

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

export default NotificationSettings; 