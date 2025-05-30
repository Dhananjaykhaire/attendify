import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import config from '../config/config'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  
  // Set up axios defaults
  axios.defaults.baseURL = config.apiUrl
  
  // Set up axios interceptors for token handling
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(interceptor)
    }
  }, [])
  
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (token) {
          // Fetch current user data
          const response = await axios.get('/api/auth/me')
          const user = response.data.user
          
          // Allow admin, faculty, and student roles
          if (!['admin', 'faculty', 'student'].includes(user.role)) {
            throw new Error('Invalid user role')
          }
          
          setCurrentUser(user)
        }
      } catch (error) {
        console.error('Authentication error:', error)
        // Clear auth data if token is invalid or user is not authorized
        localStorage.removeItem('token')
        setToken(null)
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [token])
  
  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password: '****' });
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { token, user } = response.data;
      
      // Allow admin, faculty, and student roles
      if (!['admin', 'faculty', 'student'].includes(user.role)) {
        throw new Error('Invalid user role');
      }
      
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message || error.message
      });
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  }
  
  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      const { token: newToken, user } = response.data
      
      // Verify user is admin or faculty
      if (!['admin', 'faculty'].includes(user.role)) {
        throw new Error('Not authorized')
      }
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setCurrentUser(user)
      
      return user
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed'
    }
  }
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setCurrentUser(null)
  }
  
  // Check if token is expired
  const isTokenExpired = () => {
    if (!token) return true
    
    try {
      const decoded = jwtDecode(token)
      return decoded.exp * 1000 < Date.now()
    } catch (error) {
      return true
    }
  }

  // Check if user can create other users
  const canCreateUsers = () => {
    return currentUser && ['admin', 'faculty'].includes(currentUser.role)
  }

  // Check if user can create admin users
  const canCreateAdmins = () => {
    return currentUser && currentUser.role === 'admin'
  }
  
  const value = {
    currentUser,
    setCurrentUser,
    loading,
    login,
    register,
    logout,
    isTokenExpired,
    canCreateUsers,
    canCreateAdmins,
    isAuthenticated: !!token && !isTokenExpired() && ['admin', 'faculty', 'student'].includes(currentUser?.role)
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}