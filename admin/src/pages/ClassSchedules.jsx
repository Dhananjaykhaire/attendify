import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon, CalendarIcon, UserGroupIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ClassSchedules = ({ currentUser }) => {
  const [schedules, setSchedules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    days: [],
    department: '',
    faculty: '',
    students: [],
    isActive: true
  });

  useEffect(() => {
    fetchSchedules();
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/class-schedules');
      setSchedules(res.data.classSchedules);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching class schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching departments');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setFaculty(res.data.filter(user => user.role === 'faculty'));
      setStudents(res.data.filter(user => user.role === 'student'));
    } catch (err) {
      console.error(err);
      toast.error('Error fetching users');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const updatedDays = [...formData.days];
      if (e.target.checked) {
        updatedDays.push(value);
      } else {
        const index = updatedDays.indexOf(value);
        if (index > -1) updatedDays.splice(index, 1);
      }
      setFormData(prev => ({ ...prev, days: updatedDays }));
    } else if (name === 'students') {
      const selected = Array.from(e.target.selectedOptions, o => o.value);
      setFormData(prev => ({ ...prev, students: selected }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.faculty) {
        toast.error('Faculty is required');
        return;
      }

      if (editingSchedule) {
        await axios.put(`/api/class-schedules/${editingSchedule._id}`, formData);
        toast.success('Updated successfully');
      } else {
        await axios.post('/api/class-schedules', formData);
        toast.success('Created successfully');
      }

      resetForm();
      setIsModalOpen(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Submit failed');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name || '',
      startTime: schedule.startTime || '',
      endTime: schedule.endTime || '',
      days: Array.isArray(schedule.days) ? schedule.days : (schedule.days ? [schedule.days] : []),
      department: schedule.department?._id || '',
      faculty: currentUser?.role === 'faculty' ? currentUser._id : (schedule.faculty?._id || schedule.faculty || ''),
      students: Array.isArray(schedule.students) ? schedule.students.map(s => s._id) : [],
      isActive: typeof schedule.isActive === 'boolean' ? schedule.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirm delete?')) return;
    try {
      await axios.delete(`/api/class-schedules/${id}`);
      toast.success('Deleted successfully');
      fetchSchedules();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      days: [],
      department: '',
      faculty: '',
      students: [],
      isActive: true
    });
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', ];

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Class Schedules</h2>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingSchedule(null);
            resetForm();
            if (currentUser?.role === 'faculty') {
              setFormData(prev => ({ ...prev, faculty: currentUser._id }));
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          <PlusIcon className="h-5 w-5 inline mr-2" /> Add Schedule
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        schedules.map((schedule) => (
          <div key={schedule._id} className="p-4 border rounded mb-4">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">{schedule.name}</h3>
                <p>{schedule.startTime} - {schedule.endTime}</p>
                <p>Days: {schedule.days.join(', ')}</p>
                <p>Faculty: {schedule.faculty?.name}</p>
                <p>Department: {schedule.department?.name}</p>
              </div>
              <div className="space-x-2">
                <button onClick={() => handleEdit(schedule)} className="text-blue-500"><PencilIcon className="h-5 w-5" /></button>
                <button onClick={() => handleDelete(schedule._id)} className="text-red-500"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </div>
          </div>
        ))
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h3 className="text-xl mb-4">{editingSchedule ? 'Edit' : 'Add'} Class Schedule</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" name="name" placeholder="Class Name" value={formData.name || ''} onChange={handleInputChange} required className="w-full border p-2 rounded" />
              <input type="time" name="startTime" value={formData.startTime || ''} onChange={handleInputChange} required className="w-full border p-2 rounded" />
              <input type="time" name="endTime" value={formData.endTime || ''} onChange={handleInputChange} required className="w-full border p-2 rounded" />

              <div className="space-y-1">
                <label>Days</label>
                <div className="grid grid-cols-3 gap-2">
                  {weekDays.map((day) => (
                    <label key={day} className="flex items-center">
                      <input type="checkbox" value={day} checked={formData.days.includes(day)} onChange={handleInputChange} />
                      <span className="ml-1">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <select
                name="department"
                value={formData.department || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>

              <select name="faculty" value={formData.faculty || ''} onChange={handleInputChange} required className="w-full border p-2 rounded">
                <option value="">Select Faculty</option>
                {faculty.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>

              <select multiple name="students" value={formData.students || []} onChange={handleInputChange} className="w-full border p-2 rounded h-24">
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>

              <div className="flex justify-end space-x-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">{editingSchedule ? 'Update' : 'Create'}</button>
                <button onClick={() => setIsModalOpen(false)} type="button" className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSchedules;
