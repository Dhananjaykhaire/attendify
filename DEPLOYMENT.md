# AWS Deployment Guide

## Prerequisites
1. AWS Account
2. AWS CLI installed and configured
3. Node.js installed on EC2 instance
4. MongoDB Atlas account (already set up)

## Step 1: Set Up EC2 Instance

1. Launch EC2 Instance:
   - Choose Amazon Linux 2 AMI
   - Select t2.micro (free tier) or larger
   - Configure Security Group:
     - Allow SSH (Port 22)
     - Allow HTTP (Port 80)
     - Allow HTTPS (Port 443)
     - Allow Custom TCP (Port 5000) for API
     - Allow Custom TCP (Port 3000) for Admin Panel

2. Connect to EC2:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

3. Install Node.js and npm:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   . ~/.nvm/nvm.sh
   nvm install 16
   nvm use 16
   ```

## Step 2: Set Up S3 Bucket

1. Create S3 Bucket:
   - Go to S3 in AWS Console
   - Create new bucket
   - Enable static website hosting
   - Configure CORS:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": []
       }
   ]
   ```

2. Create IAM User:
   - Create new IAM user with programmatic access
   - Attach S3FullAccess policy
   - Save access key and secret key

## Step 3: Deploy Application

1. Clone Repository:
   ```bash
   git clone https://github.com/yourusername/Face-Recognition-Attendance-System.git
   cd Face-Recognition-Attendance-System
   ```

2. Update Configuration:
   - Update `.env.production` with your AWS credentials
   - Update `client/src/config/config.js` with your EC2 IP
   - Update `admin/src/config/config.js` with your EC2 IP

3. Run Deployment Script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. Upload Client to S3:
   ```bash
   aws s3 sync client/build/ s3://your-bucket-name
   ```

## Step 4: Set Up Domain and SSL (Optional)

1. Register Domain in Route 53
2. Create SSL Certificate in ACM
3. Configure CloudFront Distribution
4. Update DNS Settings

## Step 5: Monitor Application

1. Check PM2 Status:
   ```bash
   pm2 status
   pm2 logs
   ```

2. Monitor Server:
   ```bash
   pm2 monit
   ```

## Troubleshooting

1. Check Logs:
   ```bash
   pm2 logs face-recognition-server
   ```

2. Restart Server:
   ```bash
   pm2 restart face-recognition-server
   ```

3. Common Issues:
   - Port already in use: Check running processes with `lsof -i :5000`
   - MongoDB connection: Verify network access in MongoDB Atlas
   - S3 access: Check IAM permissions and bucket policy

## Maintenance

1. Update Application:
   ```bash
   git pull
   ./deploy.sh
   ```

2. Backup Database:
   - Use MongoDB Atlas automated backups
   - Configure backup retention policy

3. Monitor Resources:
   - Set up CloudWatch alarms
   - Monitor EC2 metrics
   - Check S3 usage

## Security Considerations

1. Keep Environment Variables Secure
2. Regularly Update Dependencies
3. Monitor AWS CloudTrail
4. Enable AWS GuardDuty
5. Implement Rate Limiting
6. Use AWS WAF for Additional Security 