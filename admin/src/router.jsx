import { createBrowserRouter } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminPrivateRoute from './components/AdminPrivateRoute';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Attendance from './pages/Attendance';
import Departments from './pages/Departments';
import UserDetail from './pages/UserDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventForm from './pages/EventForm';
import EventAttendees from './pages/EventAttendees';
import ClassSchedules from './pages/ClassSchedules';
import NotFound from './components/NotFound';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLogin />,
  },
  {
    path: '/',
    element: <AdminPrivateRoute />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'users/:id',
        element: <UserDetail />,
      },
      {
        path: 'attendance',
        element: <Attendance />,
      },
      {
        path: 'departments',
        element: <Departments />,
      },
      {
        path: 'class-schedules',
        element: <ClassSchedules />,
      },
      {
        path: 'events',
        element: <Events />,
      },
      {
        path: 'events/new',
        element: <EventForm />,
      },
      {
        path: 'events/:id',
        element: <EventDetail />,
      },
      {
        path: 'events/:id/edit',
        element: <EventForm />,
      },
      {
        path: 'events/:id/attendees',
        element: <EventAttendees />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
], {
  future: {
    v7_startTransition: true,
  },
}); 