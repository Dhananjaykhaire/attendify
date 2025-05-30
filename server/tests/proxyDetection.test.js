import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { connect, clearDatabase, closeDatabase } from './setup.js';
import app from './testApp.js';
import User from '../models/User.js';
import ClassSchedule from '../models/ClassSchedule.js';
import Notification from '../models/Notification.js';

// Mock email service
jest.mock('../config/email.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  verifyEmailConfig: jest.fn().mockResolvedValue(true)
}));

describe('Proxy Detection Tests', () => {
  let studentToken;
  let facultyToken;
  let student;
  let faculty;
  let classSchedule;
  let department;

  beforeAll(async () => {
    await connect();
    
    // Create test department
    department = new mongoose.Types.ObjectId();

    // Create test users
    faculty = await User.create({
      name: 'Test Faculty',
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty',
      department: department
    });

    student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      department: department
    });

    // Create test class schedule
    classSchedule = await ClassSchedule.create({
      name: 'Test Class',
      faculty: faculty._id,
      students: [student._id],
      startTime: '09:00',
      endTime: '10:00',
      days: ['Monday'],
      department: department,
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204] // Example coordinates
      }
    });

    // Get tokens
    const facultyRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@test.com', password: 'password123' });
    facultyToken = facultyRes.body.token;

    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'password123' });
    studentToken = studentRes.body.token;
  });

  beforeEach(async () => {
    // Only clear notifications, keep other test data
    await Notification.deleteMany({});
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('Should detect VPN usage', async () => {
    const response = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('User-Agent', 'Mozilla/5.0')
      .set('via', 'VPN-Proxy')
      .send({
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Access denied');
    
    // Check if notification was created
    const notifications = await Notification.find({ type: 'proxy_attempt' });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toContain('Proxy Attempt');
  });

  test('Should detect location mismatch', async () => {
    const response = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition',
        location: {
          coordinates: [72.8567, 19.5204] // Different location from class
        }
      });

    // Check if notification was created for location mismatch
    const notifications = await Notification.find({
      type: 'proxy_attempt',
      title: 'Location Mismatch Alert'
    });
    expect(notifications.length).toBeGreaterThan(0);
  });

  test('Should detect rapid attendance attempts', async () => {
    // First attempt
    await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      });

    // Second attempt within 5 minutes
    const response = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      });

    expect(response.status).toBe(400);
    
    // Check if notification was created
    const notifications = await Notification.find({
      type: 'proxy_attempt',
      title: 'Suspicious Rapid Attendance'
    });
    expect(notifications.length).toBeGreaterThan(0);
  });

  test('Should detect attendance without active class', async () => {
    // Temporarily remove student from class
    await ClassSchedule.findByIdAndUpdate(classSchedule._id, {
      $pull: { students: student._id }
    });

    const response = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No active classes found for current time');

    // Check if notification was created
    const notifications = await Notification.find({
      type: 'proxy_attempt',
      title: 'Proxy Attendance Attempt'
    });
    expect(notifications.length).toBeGreaterThan(0);

    // Restore student to class
    await ClassSchedule.findByIdAndUpdate(classSchedule._id, {
      $push: { students: student._id }
    });
  });
}); 