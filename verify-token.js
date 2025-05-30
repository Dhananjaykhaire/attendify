const jwt = require('jsonwebtoken');

// Get the token from command line arguments or use a default
const token = process.argv[2] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImlhdCI6MTc0ODI1MzczMywiZXhwIjoxNzQ4MjU3MzMzfQ.Ui0yGqKopBFZ3WZxGeQub63gxUfULl8GS1_ybm8WnE4';

try {
    // Verify the token
    const decoded = jwt.verify(token, 'FaceRecognition');
    
    console.log('\nToken is valid! Decoded contents:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check expiration
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTimestamp) {
        console.log('\n⚠️ Warning: Token has expired!');
        console.log('Expired at:', new Date(decoded.exp * 1000).toLocaleString());
    } else {
        const timeLeft = decoded.exp - currentTimestamp;
        const hoursLeft = Math.floor(timeLeft / 3600);
        const minutesLeft = Math.floor((timeLeft % 3600) / 60);
        console.log(`\n✅ Token is valid for: ${hoursLeft} hours and ${minutesLeft} minutes`);
        console.log('Expires at:', new Date(decoded.exp * 1000).toLocaleString());
    }
} catch (error) {
    console.log('\n❌ Token Error:');
    if (error.name === 'TokenExpiredError') {
        console.log('Token has expired!');
        // Show when it expired
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
            console.log('Expired at:', new Date(decoded.exp * 1000).toLocaleString());
        }
    } else if (error.name === 'JsonWebTokenError') {
        console.log('Invalid token!');
    } else {
        console.log('Error:', error.message);
    }
} 