import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import rateLimit from 'express-rate-limit';

const IconWithTooltip = ({ icon: Icon, tooltip, to, badge, className = "" }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <Link 
        to={to}
        className={`p-2 hover:bg-indigo-700 rounded-full transition-all duration-200 relative transform hover:scale-110 ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon className="h-6 w-6" />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
      {showTooltip && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Set up Socket.IO connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    // Listen for new notifications
    socket.on('newNotification', () => {
      setUnreadCount(prev => prev + 1);
    });

    // Listen for notifications being marked as read
    socket.on('notificationRead', () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    socket.on('allNotificationsRead', () => {
      setUnreadCount(0);
    });

    return () => socket.close();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xl font-bold">Attendance System</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-3 mr-4">
              {/* Notification Bell with Badge */}
              <IconWithTooltip 
                icon={BellIcon} 
                tooltip="View Notifications"
                to="/notifications"
                badge={unreadCount}
                className="hover:text-white"
              />

              {/* Settings Button (Gear Icon) */}
              <IconWithTooltip 
                icon={Cog6ToothIcon} 
                tooltip="Settings"
                to="/settings"
                badge={0}
                className="hover:text-white"
              />
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 border-l border-indigo-500 pl-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">{user?.name || 'User'}</span>
                <span className="text-xs text-indigo-200">{user?.role || 'Guest'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 