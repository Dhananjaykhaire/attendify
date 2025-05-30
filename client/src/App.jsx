import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import PrivateRoute from './components/PrivateRoute'
import Login from './Auth/Login'
import Dashboard from './components/Dashboard'
import AttendanceCapture from './components/AttendanceCapture'
import AttendanceHistory from './components/AttendanceHistory'
import Profile from './components/Profile'
import Events from './components/Events'
import NotFound from './components/NotFound'
import ForgotPassword from './Auth/ForgotPassword'
import ResetPassword from './Auth/ResetPassword'
import OAuthCallback from './Auth/OAuthCallback'
import ProxyAttendance from './components/ProxyAttendance'
import ProxyStats from './components/ProxyStats'
import LeaveNotice from './components/LeaveNotice'
import TestNotifications from './pages/TestNotifications'
import NotificationSettings from './pages/NotificationSettings'
import Notifications from './components/Notifications'
import ClassSchedules from './components/ClassSchedules'
import Settings from './pages/Settings'

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      
      <Route path="/" element={<PrivateRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="mark-attendance" element={<AttendanceCapture />} />
        <Route path="history" element={<AttendanceHistory />} />
        <Route path="events" element={<Events />} />
        <Route path="profile" element={<Profile />} />
        <Route path="proxy-attendance" element={<ProxyAttendance />} />
        <Route path="leave-notice" element={<LeaveNotice />} />
        <Route path="proxy-stats" element={<ProxyStats />} />
        <Route path="test-notifications" element={<TestNotifications />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notification-settings" element={<NotificationSettings />} />
        <Route path="class-schedules" element={<ClassSchedules />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App