import { sendEmail } from '../config/email.js';

const testEmail = async () => {
  try {
    const result = await sendEmail({
      to: 'dhananjay.khaire2004@gmail.com', // Your email to test
      subject: 'Test Email from Smart Attendance System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #4F46E5;">Test Email</h1>
          <p>This is a test email from your Smart Attendance System.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if EMAIL_USER and EMAIL_PASS are set correctly in .env.local');
    console.log('2. Make sure 2-Step Verification is enabled in your Google Account');
    console.log('3. Verify you are using an App Password, not your regular Gmail password');
    console.log('4. Check your Gmail account for any security alerts');
  }
};

testEmail(); 