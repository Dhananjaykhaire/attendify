const config = {
  development: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.example.com',
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'https://api.example.com',
  }
};

const environment = import.meta.env.MODE || 'development';
export default config[environment];
