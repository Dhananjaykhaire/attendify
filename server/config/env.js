const isProduction = process.env.NODE_ENV === 'production';

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'development-jwt-secret-change-me';
};

export const getRefreshTokenSecret = () => {
  if (process.env.REFRESH_TOKEN_SECRET) return process.env.REFRESH_TOKEN_SECRET;
  if (isProduction) {
    throw new Error('REFRESH_TOKEN_SECRET is required in production');
  }
  return 'development-refresh-secret-change-me';
};

export const getAllowedOrigins = () => {
  const origins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set(origins));
};

export const validateCriticalEnv = () => {
  if (!isProduction) return;

  requireEnv('MONGODB_URI');
  requireEnv('JWT_SECRET');
  requireEnv('REFRESH_TOKEN_SECRET');
};
