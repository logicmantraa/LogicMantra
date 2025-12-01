import nodemailer from 'nodemailer';

// Helper function to strip quotes from environment variables
// Some hosting platforms (like Render) automatically add quotes, which breaks authentication
const stripQuotes = (value) => {
  if (!value) return value;
  // Remove surrounding quotes (both single and double)
  return value.toString().replace(/^["']|["']$/g, '').trim();
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For Gmail, you can use OAuth2 or App Password
  // For other services, adjust accordingly
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword, // Use App Password for Gmail
    },
  });

  return transporter;
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const emailUser = stripQuotes(process.env.EMAIL_USER);
    const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
    
    if (!emailUser || !emailPassword) {
      console.log('Email not configured: EMAIL_USER or EMAIL_PASSWORD is missing');
      return false;
    }
    
    console.log(`Email configuration check: User=${emailUser}, Host=${process.env.EMAIL_HOST || 'smtp.gmail.com'}, Port=${process.env.EMAIL_PORT || '587'}`);
    
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error.message);
    console.error('Full error details:', error);
    console.log('Email notifications will be disabled');
    return false;
  }
};

// Send email function
export const sendEmail = async (options) => {
  try {
    // Check if email is configured
    const emailUser = stripQuotes(process.env.EMAIL_USER);
    const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
    
    if (!emailUser || !emailPassword) {
      console.log('Email not configured. Skipping email send.');
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter();

    // Strip quotes from EMAIL_FROM_NAME as well
    const fromName = stripQuotes(process.env.EMAIL_FROM_NAME) || 'Logic Mantraa';

    const mailOptions = {
      from: `"${fromName}" <${emailUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', options.to, '- Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email to', options.to, ':', error.message);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    return { success: false, error: error.message };
  }
};

export default { sendEmail, verifyEmailConfig };

