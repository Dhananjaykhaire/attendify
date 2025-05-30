import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Switch } from '@headlessui/react';

const NotificationSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/notification-settings');
      setSettings(response.data.settings);
    } catch (error) {
      setError('Error fetching notification settings');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (section, field, value) => {
    try {
      const update = {
        [section]: {
          [field]: value
        }
      };

      const response = await axios.put('/api/notification-settings', update);
      setSettings(response.data.settings);
      setMessage('Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Error updating settings');
      console.error('Error:', error);
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post('/api/notification-settings/reset');
      setSettings(response.data.settings);
      setMessage('Settings reset to default');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Error resetting settings');
      console.error('Error:', error);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Customize how you want to be notified about attendance activities.
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Proxy Attempts Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Proxy Attempt Detection</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Enable Notifications</label>
                <p className="text-sm text-gray-500">
                  Get notified when proxy attempts are detected
                </p>
              </div>
              <Switch
                checked={settings?.proxyAttempts?.enabled}
                onChange={(value) => handleUpdate('proxyAttempts', 'enabled', value)}
                className={`${
                  settings?.proxyAttempts?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className="sr-only">Enable notifications</span>
                <span
                  className={`${
                    settings?.proxyAttempts?.enabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Email Notifications</label>
                <p className="text-sm text-gray-500">
                  Receive email alerts for proxy attempts
                </p>
              </div>
              <Switch
                checked={settings?.proxyAttempts?.emailNotification}
                onChange={(value) => handleUpdate('proxyAttempts', 'emailNotification', value)}
                className={`${
                  settings?.proxyAttempts?.emailNotification ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className="sr-only">Enable email notifications</span>
                <span
                  className={`${
                    settings?.proxyAttempts?.emailNotification ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div>
              <label className="font-medium">Distance Threshold (meters)</label>
              <input
                type="number"
                value={settings?.proxyAttempts?.distanceThreshold}
                onChange={(e) => handleUpdate('proxyAttempts', 'distanceThreshold', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min="10"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* Email Digest Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Email Digest</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Enable Email Digest</label>
                <p className="text-sm text-gray-500">
                  Receive a summary of attendance activities
                </p>
              </div>
              <Switch
                checked={settings?.emailDigest?.enabled}
                onChange={(value) => handleUpdate('emailDigest', 'enabled', value)}
                className={`${
                  settings?.emailDigest?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span className="sr-only">Enable email digest</span>
                <span
                  className={`${
                    settings?.emailDigest?.enabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div>
              <label className="font-medium">Frequency</label>
              <select
                value={settings?.emailDigest?.frequency}
                onChange={(e) => handleUpdate('emailDigest', 'frequency', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="never">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Digest Time</label>
              <input
                type="time"
                value={settings?.emailDigest?.time}
                onChange={(e) => handleUpdate('emailDigest', 'time', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 