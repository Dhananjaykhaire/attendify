import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TestNotifications = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');

  const simulateProxyAttempt = async () => {
    try {
      // Attempt to mark attendance with a proxy header
      await axios.post('/api/attendance/mark', {
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      }, {
        headers: {
          'via': 'VPN-Proxy'
        }
      });
    } catch (error) {
      setMessage('Proxy attempt simulated - check notifications');
    }
  };

  const simulateLocationMismatch = async () => {
    try {
      // Attempt to mark attendance from a different location
      await axios.post('/api/attendance/mark', {
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition',
        location: {
          coordinates: [0, 0] // Far from any class location
        }
      });
    } catch (error) {
      setMessage('Location mismatch simulated - check notifications');
    }
  };

  const simulateRapidAttempts = async () => {
    try {
      // First attempt
      await axios.post('/api/attendance/mark', {
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      });

      // Second attempt immediately after
      await axios.post('/api/attendance/mark', {
        faceEmbedding: 'test-embedding',
        confidence: 0.95,
        type: 'face-recognition'
      });
    } catch (error) {
      setMessage('Rapid attempts simulated - check notifications');
    }
  };

  if (currentUser?.role !== 'faculty' && currentUser?.role !== 'admin') {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Only faculty members can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Notification System</h1>
      
      {message && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Test Proxy Detection</h2>
          <p className="text-sm text-gray-600 mb-2">
            Simulates a student trying to mark attendance using a VPN/proxy.
          </p>
          <button
            onClick={simulateProxyAttempt}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Simulate Proxy Attempt
          </button>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Test Location Mismatch</h2>
          <p className="text-sm text-gray-600 mb-2">
            Simulates a student trying to mark attendance from outside the class location.
          </p>
          <button
            onClick={simulateLocationMismatch}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Simulate Location Mismatch
          </button>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Test Rapid Attempts</h2>
          <p className="text-sm text-gray-600 mb-2">
            Simulates a student trying to mark attendance multiple times within 5 minutes.
          </p>
          <button
            onClick={simulateRapidAttempts}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Simulate Rapid Attempts
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications; 