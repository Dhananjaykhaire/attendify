import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Listen for new notifications
    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
              </div>
            </div>
          </div>
        </div>
      ));
    });

    fetchNotifications();

    return () => newSocket.close();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
    } catch (error) {
      setError('Error fetching notifications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'proxy_attempt':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'location_mismatch':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      case 'rapid_attempts':
        return 'bg-orange-50 border-orange-500 text-orange-700';
      default:
        return 'bg-blue-50 border-blue-500 text-blue-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">
            View your recent notifications and alerts
          </p>
        </div>
        {notifications.some(notif => !notif.read) && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No notifications to display</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`relative border-l-4 p-4 rounded-lg shadow-sm transition-all duration-200 ${
                getNotificationColor(notification.type)
              } ${!notification.read ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h3 className="font-semibold flex items-center">
                    {notification.title}
                    {!notification.read && (
                      <span className="ml-2 inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
                    )}
                  </h3>
                  <p className="mt-1">{notification.message}</p>
                  {notification.details && (
                    <div className="mt-2 text-sm">
                      <strong>Details:</strong> {notification.details}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 