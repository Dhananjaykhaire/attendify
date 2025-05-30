import ClientOnly from '../components/ClientOnly';
import AttendanceCapture from '../components/AttendanceCapture';

const AttendancePage = () => {
  return (
    <ClientOnly
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AttendanceCapture />
    </ClientOnly>
  );
};

export default AttendancePage; 