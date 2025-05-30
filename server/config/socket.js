import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Store active users
const activeUsers = new Map();

export const configureSocket = (io) => {
  // Middleware to handle authentication
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          socket.userId = userId;
          socket.userRole = user.role;
          next();
        } else {
          next(new Error('Authentication error'));
        }
      } else {
        next();
      }
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('New client connected');

    // Join user-specific room if authenticated
    if (socket.userId) {
      socket.join(socket.userId);
      
      // Join role-specific room
      if (socket.userRole) {
        socket.join(socket.userRole);
      }

      // Update user's online status
      await User.findByIdAndUpdate(socket.userId, { lastActive: new Date() });

      // Notify admins of user connection
      if (socket.userRole !== 'admin') {
        io.to('admin').emit('userConnected', {
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date()
        });
      }
    }

    // Handle password reset notifications
    socket.on('requestPasswordReset', async (data) => {
      if (socket.userRole === 'admin') {
        io.to('admin').emit('passwordResetRequested', {
          ...data,
          timestamp: new Date()
        });
      }
    });

    socket.on('passwordResetCompleted', async (data) => {
      if (socket.userRole === 'admin') {
        io.to('admin').emit('passwordResetSuccess', {
          ...data,
          timestamp: new Date()
        });
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        // Update last active timestamp
        await User.findByIdAndUpdate(socket.userId, { lastActive: new Date() });

        // Notify admins of user disconnection
        if (socket.userRole !== 'admin') {
          io.to('admin').emit('userDisconnected', {
            userId: socket.userId,
            role: socket.userRole,
            timestamp: new Date()
          });
        }
      }
      console.log('Client disconnected');
    });
  });

  return io;
}; 