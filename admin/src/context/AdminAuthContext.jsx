import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import config from '../config/config'

const AdminAuthContext = createContext()

export const useAdminAuth = () => useContext(AdminAuthContext)

export const AdminAuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [loading, setLoading] = useState(true)
  
  // Set up axios defaults
  axios.defaults.baseURL = config.apiUrl
  
  // Set up axios interceptors for token handling
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token')
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
          // Fetch current admin data
          const response = await axios.get('/api/auth/me')
          const admin = response.data.user
          
          // Verify user is admin
          if (admin.role !== 'admin') {
            throw new Error('Not authorized as admin')
          }
          
          setCurrentAdmin(admin)
        }
      } catch (error) {
        console.error('Authentication error:', error)
        // Clear auth data if token is invalid
        localStorage.removeItem('admin_token')
        setToken(null)
        setCurrentAdmin(null)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [token])
  
  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password: '****' })
      const response = await axios.post('/api/auth/login', {
        email: email.trim(),
        password: password
      })
      
      const { token: newToken, user } = response.data
      
      // Verify user is an admin
      if (!user) {
        throw new Error('No user data received')
      }
      
      if (user.role !== 'admin') {
        throw new Error('Not authorized as admin')
      }
      
      localStorage.setItem('admin_token', newToken)
      setToken(newToken)
      setCurrentAdmin(user)
      
      return user
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid credentials')
      }
      
      throw new Error(error.response?.data?.message || 'Login failed. Please try again.')
    }
  }
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
    setCurrentAdmin(null)
    delete axios.defaults.headers.common['Authorization']
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
  
  const value = {
    currentAdmin,
    loading,
    login,
    logout,
    isTokenExpired,
    isAuthenticated: !!token && !isTokenExpired() && currentAdmin?.role === 'admin'
  }
  
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}