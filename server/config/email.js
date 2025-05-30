import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // Add these settings to improve deliverability
  pool: true,
  maxConnections: 1,
  rateDelta: 20000,
  rateLimit: 5
});

// Test email configuration
const testEmailConfig = async () => {
  try {
    // First verify the configuration
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');

    // Send a test email
    const info = await transporter.sendMail({
      from: `Face Recognition System <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email from Face Recognition System',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your SMTP configuration.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Configuration details:</p>
        <ul>
          <li>Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}</li>
          <li>Port: ${process.env.EMAIL_PORT || '587'}</li>
          <li>User: ${process.env.EMAIL_USER}</li>
        </ul>
      `
    });

    console.log('✅ Test email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    console.log('\nPlease check your email configuration:');
    console.log('1. EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Missing');
    console.log('2. EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing');
    console.log('3. Make sure 2-Step Verification is enabled in your Google Account');
    console.log('4. Verify your Gmail App Password is correct');
    return false;
  }
};

// Email templates with improved formatting
export const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Face Recognition Attendance System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">Welcome, ${name}! 👋</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Thank you for joining our Face Recognition Attendance System.</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">You can now:</p>
        <ul style="color: #374151; font-size: 16px; line-height: 1.5;">
          <li>Mark your attendance using facial recognition</li>
          <li>View your attendance history</li>
          <li>Manage your profile</li>
        </ul>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">If you have any questions, feel free to reach out to our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #6B7280; font-size: 14px;">
            This is an automated message from Face Recognition Attendance System.
          </p>
        </div>
      </div>
    `
  }),

  resetPassword: (resetUrl) => ({
    subject: 'Password Reset Request - Face Recognition System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">Password Reset Request</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;
                    font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">This link will expire in 1 hour.</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">If you didn't request this, please ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #6B7280; font-size: 14px;">
            This is a secure message from Face Recognition Attendance System.
          </p>
        </div>
      </div>
    `
  })
};

// Send email helper function with improved headers
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: {
        name: 'Face Recognition Attendance System',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Remote-IP': '0.0.0.0'
      },
      priority: 'high'
    });
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

// Test the configuration on startup
testEmailConfig();

export default transporter; 