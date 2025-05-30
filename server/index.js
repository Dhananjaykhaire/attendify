import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import fileUpload from 'express-fileupload';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import ImageKit from 'imagekit';
import { validateImageKitConfig } from './config/imagekit.js';
import { configureSocket } from './config/socket.js';
import passport from './config/passport.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import departmentRoutes from './routes/departments.js';
import eventRoutes from './routes/events.js';
import imagekitRoutes from './routes/imagekit.js';
import notificationRoutes from './routes/notifications.js';
import classScheduleRoutes from './routes/classSchedule.js';
import notificationSettingsRoutes from './routes/notificationSettings.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 5000;
const ALTERNATIVE_PORTS = [5001, 5002, 5003, 5004, 5005];

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up global middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());
app.use(compression());
app.use(xss());
app.use(hpp());

// Initialize Passport
app.use(passport.initialize());

// Configure file upload
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Apply rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);

// Set up Socket.IO
configureSocket(io);
app.set('io', io);

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/imagekit', imagekitRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/class-schedules', classScheduleRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/face-recognition-attendance";

const startServer = async () => {
  try {
    // Validate ImageKit configuration
    if (!validateImageKitConfig()) {
      console.error('⚠️ ImageKit configuration is incomplete. Please check your .env.local file.');
    } else {
      console.log('✅ ImageKit configuration is valid');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10
    });
    console.log('✅ MongoDB connected successfully');
    
    try {
      // Find and fix admin user
      const adminUser = await mongoose.model('User').findOne({ email: 'dhananjay.khaire2004@gmail.com' });
      if (adminUser) {
        adminUser.isActive = true;
        await adminUser.save();
        console.log('✅ Admin user activated successfully');
      } else {
        const User = mongoose.model('User');
        await User.createDefaultAdmin();
      }
    } catch (error) {
      console.error('Error managing admin account:', error);
    }

    // Try to start server on the main port or alternative ports
    const tryPort = async (port) => {
      try {
        await new Promise((resolve, reject) => {
          server.listen(port, '0.0.0.0')
            .once('listening', () => {
              console.log(`✅ Server running on port ${port}`);
              console.log(`📡 Server accessible at:`);
              console.log(`   - Local: http://localhost:${port}`);
              console.log(`   - Network: http://192.168.137.1:${port}`);
              resolve();
            })
            .once('error', (err) => {
              if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is in use, trying next port...`);
                reject(err);
              } else {
                reject(err);
              }
            });
        });
        return true;
      } catch (err) {
        if (err.code !== 'EADDRINUSE') throw err;
        return false;
      }
    };

    // Try main port first, then alternatives
    let success = await tryPort(PORT);
    if (!success) {
      for (const altPort of ALTERNATIVE_PORTS) {
        success = await tryPort(altPort);
        if (success) break;
      }
    }

    if (!success) {
      throw new Error('All ports are in use. Please free up a port or specify a different port in .env.local');
    }

    // app.use(limiter);

  } catch (err) {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
};

startServer();
