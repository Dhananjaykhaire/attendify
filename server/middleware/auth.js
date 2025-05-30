import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to verify token
const verifyAuthToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FaceRecognition');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }
    
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      registrationId: user.registrationId
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

// Regular auth middleware with enhanced error handling
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    try {
      const userData = await verifyAuthToken(token);
      req.user = userData;

      // Log successful authentication
      console.log('Authentication successful:', {
        userId: userData.id,
        name: userData.name,
        role: userData.role,
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.message === 'User not found') {
        return res.status(403).json({
          success: false,
          message: 'User account not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (error.message === 'User account is deactivated') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin authorization middleware with enhanced error handling
export const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'This action requires administrator privileges',
          code: 'ADMIN_REQUIRED'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin authorization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Faculty authorization middleware with enhanced error handling
export const facultyAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'This action requires faculty privileges',
          code: 'FACULTY_REQUIRED'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Faculty auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during faculty authorization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};