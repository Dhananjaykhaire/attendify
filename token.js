const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: '12345' }, 'FaceRecognition', { expiresIn: '1h' });
console.log(token); 