import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For Gmail, you can use OAuth2 or App Password
  // For other services, adjust accordingly
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
  });

  return transporter;
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    // Check if email credentials are provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
      console.warn('   Email notifications (OTP, welcome emails, etc.) will be disabled');
      console.warn('   To enable emails, set these environment variables in your production environment');
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    console.log(`   Using: ${process.env.EMAIL_USER} via ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${process.env.EMAIL_PORT || '587'}`);
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Please check your EMAIL_USER and EMAIL_PASSWORD.');
      console.error('   For Gmail, make sure you are using an App Password, not your regular password.');
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Please check your EMAIL_HOST and EMAIL_PORT.');
    }
    console.warn('⚠️  Email notifications will be disabled until configuration is fixed');
    return false;
  }
};

// Send email function
export const sendEmail = async (options) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ Email not configured. Missing EMAIL_USER or EMAIL_PASSWORD environment variables.');
      console.error('Please set the following environment variables:');
      console.error('  - EMAIL_USER (your email address)');
      console.error('  - EMAIL_PASSWORD (your email app password)');
      console.error('  - EMAIL_HOST (optional, defaults to smtp.gmail.com)');
      console.error('  - EMAIL_PORT (optional, defaults to 587)');
      return { success: false, message: 'Email not configured', error: 'Missing EMAIL_USER or EMAIL_PASSWORD' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Logic Mantraa'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId, 'to:', options.to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Full error:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD.');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Check your EMAIL_HOST and EMAIL_PORT.');
    }
    return { success: false, error: error.message, code: error.code };
  }
};

export default { sendEmail, verifyEmailConfig };

