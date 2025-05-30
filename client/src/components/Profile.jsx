import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  CameraIcon, 
  TrashIcon, 
  UserCircleIcon, 
  CheckBadgeIcon, 
  KeyIcon, 
  ArrowUpTrayIcon, 
  XMarkIcon, 
  CheckCircleIcon, 
  EnvelopeIcon, 
  IdentificationIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import axiosInstance from '../utils/axios';

const Profile = () => {
  const { currentUser, setCurrentUser, logout } = useAuth();
  const [faceData, setFaceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [captureMode, setCaptureMode] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isFaceRegistering, setIsFaceRegistering] = useState(false);
  const [webcamRef, setWebcamRef] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [blazeFaceModel, setBlazeFaceModel] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    registrationId: currentUser?.registrationId || '',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // First, add state variables to track password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update profile form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        registrationId: currentUser.registrationId || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    // Load face detection models
    const loadModels = async () => {
      try {
        await tf.ready();
        const model = await blazeface.load();
        setBlazeFaceModel(model);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        toast.error('Failed to load face detection models');
      }
    };

    loadModels();

    // Fetch user's face data and profile
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/auth/me');
        setFaceData(response.data.faceData || []);
        setProfileForm({
          name: response.data.name || '',
          email: response.data.email || '',
          registrationId: response.data.registrationId || '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load your profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Setup face detection when camera is active
  useEffect(() => {
    if (!webcamRef || !modelsLoaded || !blazeFaceModel || !captureMode) return;

    const detectFace = async () => {
      if (webcamRef.video.readyState !== 4) return;

      const video = webcamRef.video;
      
      // Detect faces using BlazeFace
      const predictions = await blazeFaceModel.estimateFaces(video);
      
      // Update face detection state
      setIsFaceDetected(predictions.length > 0);
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [webcamRef, modelsLoaded, blazeFaceModel, captureMode]);

  const startCameraCapture = () => {
    setCaptureMode(true);
  };

  const cancelCameraCapture = () => {
    setCaptureMode(false);
    setIsFaceDetected(false);
  };

  const registerFace = async () => {
    if (!isFaceDetected) {
      toast.error('No face detected. Please position your face in the frame');
      return;
    }

    setIsFaceRegistering(true);
    try {
      // Get video element
      const video = webcamRef.video;
      
      // Generate face embeddings using BlazeFace
      const predictions = await blazeFaceModel.estimateFaces(video);
      
      if (predictions.length === 0) {
        throw new Error('No face detected during embedding generation');
      }

      // Get the first face prediction (strongest detection)
      const face = predictions[0];
      
      // Create face embedding from the prediction
      const embedding = [
        ...face.landmarks.flat(), // Facial landmarks
        ...face.probability,      // Detection confidence
        face.topLeft[0], face.topLeft[1],
        face.bottomRight[0], face.bottomRight[1]
      ];
      
      const response = await axios.post('/api/users/face', {
        faceEmbedding: embedding,
        confidence: face.probability[0]
      });
      
      toast.success('Face registered successfully!');
      setFaceData([...faceData, response.data.faceData[response.data.faceData.length - 1]]);
      setCaptureMode(false);
    } catch (error) {
      console.error('Error registering face:', error);
      toast.error(error.response?.data?.message || 'Failed to register face. Please try again.');
    } finally {
      setIsFaceRegistering(false);
    }
  };

  const deleteFace = async (faceId) => {
    try {
      await axios.delete(`/api/users/face/${faceId}`);
      setFaceData(faceData.filter(data => data.faceId !== faceId));
      toast.success('Face data removed successfully');
    } catch (error) {
      console.error('Error deleting face data:', error);
      toast.error(error.response?.data?.message || 'Failed to delete face data');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Check password match
    if (name === 'confirmPassword' && value !== passwordForm.newPassword) {
      setPasswordErrors(prev => ({ 
        ...prev, 
        confirmPassword: 'Passwords do not match' 
      }));
    } else if (name === 'confirmPassword') {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setChangingPassword(true);
    try {
      await axios.put('/api/users/password', passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      
      if (errorMessage.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      
      if (fileInputRef.current?.files[0]) {
        const file = fileInputRef.current.files[0];
        // Validate file size on client side
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size should be less than 5MB');
        }
        formData.append('profileImage', file);
      }
      
      const response = await axiosInstance.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the current user data
      setCurrentUser(prev => ({
        ...prev,
        ...response.data
      }));
      
      toast.success('Profile updated successfully');
      setEditingProfile(false);
      
      // Clear the file input and preview
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setPreviewImage(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 400:
            toast.error(error.response.data.message || 'Invalid input. Please check your data.');
            break;
          case 401:
            toast.error('Your session has expired. Please log in again.');
            logout();
            break;
          case 403:
            toast.error('You do not have permission to perform this action.');
            logout();
            break;
          case 413:
            toast.error('The uploaded file is too large. Please choose a smaller file.');
            break;
          default:
            toast.error('An error occurred while updating your profile.');
        }
      } else if (error.request) {
        toast.error('Unable to connect to the server. Please check your internet connection.');
      } else {
        toast.error(error.message || 'An unexpected error occurred.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Profile Tabs */}
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="profile">Profile Information</option>
            <option value="face">Face Recognition</option>
            <option value="security">Security Settings</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <UserCircleIcon className="h-5 w-5 mr-2" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('face')}
                className={`${
                  activeTab === 'face'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Face Recognition
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`${
                  activeTab === 'security'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <KeyIcon className="h-5 w-5 mr-2" />
                Security Settings
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information</p>
            </div>
            {editingProfile ? (
              <button
                onClick={() => setEditingProfile(false)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            )}
          </div>
          
          <div className="border-t border-gray-200">
            {editingProfile ? (
              <div className="p-6">
                <form onSubmit={submitProfileUpdate}>
                  <div className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="h-32 w-32 rounded-full bg-gray-100 overflow-hidden">
                          {previewImage ? (
                            <img src={previewImage} alt="Profile preview" className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon className="h-full w-full p-6 text-gray-400" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0">
                          <label 
                            htmlFor="profile-image" 
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
                          >
                            <ArrowUpTrayIcon className="h-4 w-4" />
                          </label>
                          <input 
                            id="profile-image" 
                            name="profileImage" 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleProfileImage}
                            className="sr-only" 
                            accept="image/*" 
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Click to upload a profile photo</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={profileForm.email}
                          disabled
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
                      </div>
                      
                      <div>
                        <label htmlFor="registrationId" className="block text-sm font-medium text-gray-700">
                          Registration ID
                        </label>
                        <input
                          type="text"
                          name="registrationId"
                          id="registrationId"
                          value={profileForm.registrationId}
                          disabled
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">Registration ID cannot be changed</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <dl>
                <div className="flex items-center justify-center bg-indigo-50 py-6 border-b border-gray-200">
                  <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                    {currentUser?.profileImage ? (
                      <img 
                        src={currentUser.profileImage} 
                        alt={currentUser.name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-gray-300" />
                    )}
                  </div>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser?.name || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Email address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser?.email || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CheckBadgeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Role
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                    {currentUser?.role || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <IdentificationIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Registration ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser?.registrationId || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CameraIcon className="h-5 w-5 mr-2 text-gray-400" />
                    Face recognition
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {faceData.length > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Enabled ({faceData.length} faces registered)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Not configured
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      )}
      
      {/* Face Recognition Tab */}
      {activeTab === 'face' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Face Recognition Data</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Register your face for contactless attendance</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {captureMode ? (
              <div className="space-y-4">
                <div className="relative">
                  <Webcam
                    audio={false}
                    ref={setWebcamRef}
                    screenshotFormat="image/jpeg"
                    onUserMedia={() => setIsCameraReady(true)}
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    mirrored
                    videoConstraints={{ facingMode: 'user' }}
                  />
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
                    {isFaceDetected && (
                      <div className="w-48 h-48 border-4 border-green-500 rounded-full animate-pulse opacity-75"></div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={cancelCameraCapture}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={registerFace}
                    disabled={!isFaceDetected || isFaceRegistering}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      (!isFaceDetected || isFaceRegistering) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isFaceRegistering ? 'Registering...' : 'Register Face'}
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 text-center">
                  {isCameraReady ? (
                    isFaceDetected ? 
                      'Face detected! Click "Register Face" to save.' :
                      'No face detected. Please position your face in the frame.'
                  ) : 'Camera loading...'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-4">
                  <button
                    onClick={startCameraCapture}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <CameraIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Register New Face
                  </button>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Face Registration Tips:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li>Make sure your face is well-lit and clearly visible</li>
                    <li>Remove glasses, masks, or other face coverings</li>
                    <li>Look directly at the camera to improve recognition accuracy</li>
                    <li>Consider registering multiple angles for better recognition</li>
                    <li>Each user can register up to 5 face images for improved accuracy</li>
                  </ul>
                </div>
                
                {loading ? (
                  <div className="text-center py-4 mt-6">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading face data...</p>
                  </div>
                ) : faceData.length > 0 ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Registered Faces ({faceData.length}):</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {faceData.map((face) => (
                        <div key={face.faceId} className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <CameraIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                Face Record {face.faceId.split('_').pop()}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteFace(face.faceId)}
                              className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Delete this face data"
                            >
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Confidence:</span>
                              <span className="font-medium text-gray-900">
                                {Math.round(face.confidence * 100)}%
                              </span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${Math.round(face.confidence * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-gray-500">
                            Registered on {new Date(face.createdAt).toLocaleDateString()} at {new Date(face.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 mt-6 bg-gray-50 rounded-lg border border-gray-200">
                    <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No face data registered</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by registering your face for contactless attendance.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your account security</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="max-w-xl">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>
              
              <form onSubmit={submitPasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className={`appearance-none block w-full px-3 py-2 border ${
                        passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                    {passwordErrors.currentPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className={`appearance-none block w-full px-3 py-2 border ${
                        passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                    {passwordErrors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className={`appearance-none block w-full px-3 py-2 border ${
                        passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
              
              <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <KeyIcon className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Password Security Tips</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use a combination of letters, numbers, and special characters</li>
                        <li>Create passwords that are at least 8 characters long</li>
                        <li>Avoid using personal information in your password</li>
                        <li>Don't reuse passwords across different websites</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;