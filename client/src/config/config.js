const config = {
  development: {
    apiUrl: 'http://localhost:5000',
    socketUrl: 'http://localhost:5000',
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://your-ec2-ip:5000',
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://your-ec2-ip:5000',
  }
};

const environment = import.meta.env.MODE || 'development';
export default config[environment]; 