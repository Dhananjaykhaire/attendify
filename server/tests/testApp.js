import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import attendanceRoutes from '../routes/attendance.js';
import authRoutes from '../routes/auth.js';

// Mock ImageKit
jest.mock('../utils/imagekit.js', () => ({
  upload: jest.fn().mockResolvedValue({ url: 'https://example.com/image.jpg' }),
  delete: jest.fn().mockResolvedValue(true)
}));

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(compression());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

export default app; 