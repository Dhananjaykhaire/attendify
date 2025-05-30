import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { router } from './router'

const App = () => {
  return (
    <AdminAuthProvider>
      <NotificationProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
                color: 'white',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
                color: 'white',
              },
            },
            loading: {
              style: {
                background: '#3B82F6',
                color: 'white',
              },
            },
          }}
        />
        <RouterProvider router={router} />
      </NotificationProvider>
    </AdminAuthProvider>
  )
}

export default App