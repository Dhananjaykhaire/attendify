#!/bin/bash

# Build client
echo "Building client..."
cd client
npm install
npm run build

# Build admin panel
echo "Building admin panel..."
cd ../admin
npm install
npm run build

# Setup server
echo "Setting up server..."
cd ../server
npm install

# Create production env file if not exists
if [ ! -f .env.production ]; then
    echo "Creating production environment file..."
    cat > .env.production << EOL
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend
JWT_SECRET=your_production_jwt_secret_here
CLIENT_URL=http://your-ec2-ip
ADMIN_URL=http://your-ec2-ip:3000
EMAIL_USER=dhananjay.khaire2004@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_SERVICE=gmail
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
EOL
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Start the server using PM2
echo "Starting server with PM2..."
pm2 delete face-recognition-server 2>/dev/null || true
pm2 start index.js --name "face-recognition-server" --env production

echo "Deployment completed!"

aws s3 sync client/build/ s3://your-bucket-name 