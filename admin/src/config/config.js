// Default configuration
const config = {
  development: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
    alternativePorts: [5001, 5002, 5003, 5004, 5005]
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
    alternativePorts: [5001, 5002, 5003, 5004, 5005]
  }
};

// In development, always use development config
const environment = import.meta.env.MODE || 'development';

// Function to test server availability
const testServerAvailability = async (port) => {
  try {
    const response = await fetch(`http://localhost:${port}/api/auth/login`, {
      method: 'HEAD'
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Find working server port
const findWorkingPort = async () => {
  const currentConfig = config[environment];
  
  // Try main port first
  const mainPort = new URL(currentConfig.apiUrl).port;
  if (await testServerAvailability(mainPort)) {
    return mainPort;
  }

  // Try alternative ports
  for (const port of currentConfig.alternativePorts) {
    if (await testServerAvailability(port)) {
      currentConfig.apiUrl = `http://localhost:${port}`;
      currentConfig.socketUrl = `http://localhost:${port}`;
      return port;
    }
  }

  return null;
};

// Export configuration with port detection
const exportedConfig = config[environment];
findWorkingPort().then(port => {
  if (port) {
    console.log(`✅ Connected to server on port ${port}`);
  } else {
    console.error('❌ Could not connect to server on any port');
  }
});

export default exportedConfig; 