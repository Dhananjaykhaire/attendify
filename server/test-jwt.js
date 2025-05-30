import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

// Test data
const testUser = {
  id: '123456789',
  role: 'student'
};

try {
  // Generate a token
  const token = jwt.sign(
    testUser,
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024',
    { expiresIn: '1d' }
  );

  console.log('Generated Token:', token);

  // Verify the token
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024'
  );

  console.log('Decoded Token:', decoded);
} catch (error) {
  console.error('JWT Error:', error);
} 