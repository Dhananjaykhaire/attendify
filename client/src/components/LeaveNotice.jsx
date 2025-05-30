import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';

const LeaveNotice = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    classScheduleId: '',
    message: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Redirect non-faculty users
  if (!loading && currentUser?.role !== 'faculty') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/class-schedules');
      // Ensure array
      const data = res.data.classes || res.data;
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load class schedules.');
      setClasses([]); // fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.classScheduleId || !formData.message || !formData.date) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting leave notice:', formData);
      const response = await axios.post('/api/notifications/leave-notice', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Leave notice response:', response.data);
      
      if (response.data.success) {
        toast.success('Leave notice sent successfully');
        // Reset form
        setFormData({
          classScheduleId: '',
          message: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        throw new Error(response.data.message || 'Failed to send leave notice');
      }
    } catch (error) {
      console.error('Error submitting leave notice:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setError(error.response?.data?.message || 'Failed to send leave notice');
      toast.error(error.response?.data?.message || 'Failed to send leave notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Log current state
  useEffect(() => {
    console.log('Current state:', {
      loading,
      error,
      classesCount: classes.length,
      currentUser
    });
  }, [loading, error, classes, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !classes.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchClasses}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit Leave Notice</h2>
            <p className="mt-1 text-sm text-gray-600">
              Notify your students about your upcoming absence
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Selection */}
            <div>
              <label htmlFor="classScheduleId" className="block text-sm font-medium text-gray-700">
                Select Class
              </label>
              <select
                id="classScheduleId"
                name="classScheduleId"
                value={formData.classScheduleId}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={submitting}
              >
                <option value="">Choose a class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} ({cls.startTime} - {cls.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Leave Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="date"
                  id="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="Enter your leave notice message..."
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Leave Notice'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveNotice; 