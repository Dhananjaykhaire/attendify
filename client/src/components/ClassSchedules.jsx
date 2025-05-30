import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  faculty: '',
  startTime: '',
  endTime: '',
  days: '',
};

const ClassSchedules = () => {
  const [classes, setClasses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchClasses();
    if (currentUser?.role === 'admin') {
      fetchFaculty();
    }
  }, [currentUser]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/class-schedules');
      const classesData = res.data.classes || res.data;
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err) {
      setError('Failed to load class schedules.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const res = await axios.get('/api/users/faculty', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Ensure we always set an array
      const facultyData = res.data.users || res.data;
      setFacultyList(Array.isArray(facultyData) ? facultyData : []);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setFacultyList([]);
      if (err.response?.status === 403) {
        setError('You do not have permission to view faculty list');
      } else {
        setError('Failed to load faculty list');
      }
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredClasses = Array.isArray(classes) 
    ? classes.filter((cls) => cls.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Class name is required.';
    if (!form.startTime) return 'Start time is required.';
    if (!form.endTime) return 'End time is required.';
    if (!form.days.trim()) return 'Days are required.';
    return '';
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    const errMsg = validateForm();
    if (errMsg) {
      setFormError(errMsg);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        days: form.days.split(',').map((d) => d.trim()),
      };
      await axios.post('/api/class-schedules', payload);
      setForm(initialForm);
      setShowForm(false);
      setSuccessMsg('Class added successfully!');
      fetchClasses();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError('Failed to add class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClass = (cls) => {
    setEditingId(cls._id);
    setForm({
      name: cls.name || '',
      faculty: currentUser?.role === 'faculty' ? currentUser._id : (cls.faculty?._id || cls.faculty || ''),
      startTime: cls.startTime || '',
      endTime: cls.endTime || '',
      days: Array.isArray(cls.days) ? cls.days.join(', ') : (cls.days || ''),
    });
    setShowForm(true);
    setFormError('');
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    const errMsg = validateForm();
    if (errMsg) {
      setFormError(errMsg);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        days: form.days.split(',').map((d) => d.trim()),
      };
      await axios.put(`/api/class-schedules/${editingId}`, payload);
      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);
      setSuccessMsg('Class updated successfully!');
      fetchClasses();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError('Failed to update class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    setSubmitting(true);
    try {
      await axios.delete(`/api/class-schedules/${id}`);
      setSuccessMsg('Class deleted successfully!');
      fetchClasses();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError('Failed to delete class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Class Schedules</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Search by class name..."
          value={search}
          onChange={handleSearch}
          className="border rounded px-3 py-2 w-full md:w-1/3"
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={() => {
            setShowForm(true);
            setForm(currentUser?.role === 'faculty'
              ? { ...initialForm, faculty: currentUser._id }
              : initialForm
            );
            setEditingId(null);
            setFormError('');
          }}
        >
          + Add Class
        </button>
      </div>

      {successMsg && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>}
      {formError && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{formError}</div>}

      {showForm && (
        <form
          onSubmit={editingId ? handleUpdateClass : handleAddClass}
          className="mb-6 p-4 bg-gray-50 rounded shadow"
        >
          <div className="mb-2">
            <label className="block font-medium">Class Name</label>
            <input
              type="text"
              name="name"
              value={form.name || ''}
              onChange={handleFormChange}
              required
              className="border rounded px-3 py-2 w-full"
              disabled={submitting}
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium">Faculty</label>
            {currentUser?.role === 'admin' ? (
              <select
                name="faculty"
                value={form.faculty || ''}
                onChange={handleFormChange}
                className="border rounded px-3 py-2 w-full"
                disabled={submitting}
              >
                <option value="">Select faculty</option>
                {facultyList.map((f) => (
                  <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="faculty"
                value={form.faculty || ''}
                onChange={handleFormChange}
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter your name (optional)"
                disabled={submitting}
              />
            )}
          </div>
          <div className="mb-2 flex gap-2">
            <div className="flex-1">
              <label className="block font-medium">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime || ''}
                onChange={handleFormChange}
                required
                className="border rounded px-3 py-2 w-full"
                disabled={submitting}
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium">End Time</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime || ''}
                onChange={handleFormChange}
                required
                className="border rounded px-3 py-2 w-full"
                disabled={submitting}
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="block font-medium">Days (comma separated)</label>
            <input
              type="text"
              name="days"
              value={form.days || ''}
              onChange={handleFormChange}
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="e.g. Monday, Wednesday, Friday"
              disabled={submitting}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={submitting}
            >
              {editingId ? 'Update Class' : 'Add Class'}
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(initialForm);
                setFormError('');
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Class Name</th>
              <th className="border px-4 py-2">Faculty</th>
              <th className="border px-4 py-2">Time</th>
              <th className="border px-4 py-2">Days</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">No classes found.</td>
              </tr>
            ) : (
              filteredClasses.map((cls) => (
                <tr key={cls._id}>
                  <td className="border px-4 py-2">{cls.name}</td>
                  <td className="border px-4 py-2">{cls.faculty?.name || facultyList.find(f => f._id === cls.faculty)?.name || cls.faculty || 'N/A'}</td>
                  <td className="border px-4 py-2">{cls.startTime} - {cls.endTime}</td>
                  <td className="border px-4 py-2">{Array.isArray(cls.days) ? cls.days.join(', ') : cls.days}</td>
                  <td className="border px-4 py-2 flex gap-2">
                    <button
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded"
                      onClick={() => handleEditClass(cls)}
                      disabled={submitting}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                      onClick={() => handleDeleteClass(cls._id)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ClassSchedules; 