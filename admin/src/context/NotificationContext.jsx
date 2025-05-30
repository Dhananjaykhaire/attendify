import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import AlertDialog from '../components/AlertDialog';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info',
    confirmLabel: 'OK',
    cancelLabel: '',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (options) => {
    setAlert({
      ...alert,
      open: true,
      ...options,
    });
  };

  const closeAlert = () => {
    setAlert({
      ...alert,
      open: false,
    });
  };

  const showToast = (message, type = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message, {
          duration: 3000,
          position: 'top-right',
        });
        break;
      case 'error':
        toast.error(message, {
          duration: 4000,
          position: 'top-right',
        });
        break;
      case 'loading':
        return toast.loading(message, {
          position: 'top-right',
        });
      default:
        toast(message, {
          duration: 3000,
          position: 'top-right',
        });
    }
  };

  const showConfirmation = (options) => {
    return new Promise((resolve) => {
      showAlert({
        type: 'warning',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          closeAlert();
          resolve(true);
        },
        onCancel: () => {
          closeAlert();
          resolve(false);
        },
        ...options,
      });
    });
  };

  const value = {
    showAlert,
    closeAlert,
    showToast,
    showConfirmation,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <AlertDialog
        open={alert.open}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmLabel={alert.confirmLabel}
        cancelLabel={alert.cancelLabel}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </NotificationContext.Provider>
  );
}; 