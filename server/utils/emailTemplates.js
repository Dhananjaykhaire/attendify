export const getPasswordResetEmailTemplate = (userName, resetLink) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>Best regards,<br>Face Recognition Attendance System Team</p>
    </div>
  `;
};

export const getPasswordResetSuccessTemplate = (userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Password Reset Successful</h2>
      <p>Hello ${userName},</p>
      <p>Your password has been successfully reset.</p>
      <p>If you did not perform this action, please contact our support team immediately.</p>
      <p>Best regards,<br>Face Recognition Attendance System Team</p>
    </div>
  `;
};

export const getNewUserEmailTemplate = (name, email, password) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #4F46E5; margin-bottom: 10px;">Welcome to Smart Attendance!</h1>
      <p style="color: #6B7280; font-size: 16px;">Your account has been created successfully.</p>
    </div>

    <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #1F2937; margin-bottom: 15px;">Your Login Credentials</h2>
      <p style="color: #4B5563; margin: 5px 0;">Email: <strong>${email}</strong></p>
      <p style="color: #4B5563; margin: 5px 0;">Password: <strong>${password}</strong></p>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E5E7EB;">
        <p style="color: #DC2626; font-size: 14px;">
          Please change your password after your first login for security.
        </p>
      </div>
    </div>

    <div style="margin-top: 30px;">
      <h3 style="color: #1F2937;">Getting Started</h3>
      <ul style="color: #4B5563; line-height: 1.6;">
        <li>Login to your account using the credentials above</li>
        <li>Set up your profile and upload a clear photo for face recognition</li>
        <li>Start marking your attendance using facial recognition</li>
        <li>View your attendance history and reports</li>
      </ul>
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" 
         style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
        Login to Your Account
      </a>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 14px; text-align: center;">
        If you have any questions or need assistance, please contact your administrator.
      </p>
      <p style="color: #6B7280; font-size: 14px; text-align: center;">
        This is an automated message from Smart Attendance System. Please do not reply to this email.
      </p>
    </div>
  </div>
`; 