const jwt = require('jsonwebtoken');

// Create a token that expires in 24 hours
const token = jwt.sign(
  { 
    userId: '12345',
    role: 'user'
  }, 
  'FaceRecognition', 
  { 
    expiresIn: '24h'  // Set expiration to 24 hours
  }
);

// Decode the token to show its contents
const decoded = jwt.decode(token);
console.log('\nGenerated Token:');
console.log(token);
console.log('\nToken Contents:');
console.log(JSON.stringify(decoded, null, 2));
console.log('\nExpiration:', new Date(decoded.exp * 1000).toLocaleString()); 