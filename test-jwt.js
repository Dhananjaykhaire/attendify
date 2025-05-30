import jwt from 'jsonwebtoken';

const payload = { userId: "12345" };
const secret = "FaceRecognition";
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('Generated JWT Token:');
console.log(token); 