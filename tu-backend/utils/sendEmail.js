const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.NODE_ENV === 'production', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'password',
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // In development, log the email instead of sending it
  if (process.env.NODE_ENV === 'development') {
    console.log('\n--- Email ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:', text || html);
    console.log('--- End Email ---\n');
    return { message: 'Email logged (development mode)' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'SynergySphere'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@synergysphere.com'}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise} - Promise that resolves when email is sent
 */
sendEmail.sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = 'Password Reset Request';
  const text = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This email was sent from SynergySphere.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

/**
 * Send welcome email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise} - Promise that resolves when email is sent
 */
sendEmail.sendWelcomeEmail = async (to, name) => {
  const subject = 'Welcome to SynergySphere!';
  const text = `Welcome to SynergySphere, ${name}!\n\nWe're excited to have you on board. Start collaborating with your team and boost your productivity.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to SynergySphere, ${name}!</h2>
      <p>We're excited to have you on board. Start collaborating with your team and boost your productivity.</p>
      <p>Get started by creating your first project and inviting your team members.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>
      <hr>
      <p style="color: #666; font-size: 12px;">This email was sent from SynergySphere.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

module.exports = sendEmail;
