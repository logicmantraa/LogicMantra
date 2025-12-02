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
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const isSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: emailPort,
    secure: isSecure,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    // Connection timeout settings for cloud providers like Render
    connectionTimeout: 10000, // 10 seconds (reduced for faster failure detection)
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    // Retry settings
    pool: false, // Disable pooling for cloud environments
    // TLS options
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    // Try different connection method
    requireTLS: true,
    debug: process.env.NODE_ENV === 'development', // Enable debug in dev
  });

  return transporter;
};

// Alternative: Try using Gmail's relay service or different ports
const createAlternativeTransporter = () => {
  const emailUser = stripQuotes(process.env.EMAIL_USER);
  const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
  
  // Try using Gmail's alternative SMTP settings
  return nodemailer.createTransport({
    service: 'gmail', // Use service name instead of host/port
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Verify email configuration (non-blocking, doesn't prevent server startup)
export const verifyEmailConfig = async () => {
  try {
    const emailUser = stripQuotes(process.env.EMAIL_USER);
    const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
    
    if (!emailUser || !emailPassword) {
      console.log('Email not configured: EMAIL_USER or EMAIL_PASSWORD is missing');
      return false;
    }
    
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = process.env.EMAIL_PORT || '587';
    console.log(`Email configuration check: User=${emailUser}, Host=${emailHost}, Port=${emailPort}`);
    
    // Try primary transporter first
    let transporter = createTransporter();
    
    try {
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout after 5 seconds')), 5000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log('Email server is ready to send messages (SMTP)');
      return true;
    } catch (primaryError) {
      console.log('Primary SMTP connection failed, trying alternative method...');
      
      // Try alternative transporter
      transporter = createAlternativeTransporter();
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Alternative verification timeout')), 5000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log('Email server is ready to send messages (Alternative SMTP)');
      return true;
    }
  } catch (error) {
    console.error('Email configuration error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.log('Email notifications will be disabled until configuration is fixed');
    console.log('Note: Render may be blocking SMTP connections. Emails will still be attempted on send.');
    return false;
  }
};

// Send email function with fallback
export const sendEmail = async (options) => {
  try {
    const emailUser = stripQuotes(process.env.EMAIL_USER);
    const emailPassword = stripQuotes(process.env.EMAIL_PASSWORD);
    
    if (!emailUser || !emailPassword) {
      console.log('Email not configured. Skipping email send.');
      return { success: false, message: 'Email not configured' };
    }

    const fromName = stripQuotes(process.env.EMAIL_FROM_NAME) || 'Logic Mantraa';
    const mailOptions = {
      from: `"${fromName}" <${emailUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    // Try primary transporter first
    let transporter = createTransporter();
    let lastError = null;
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to', options.to, '- Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (primaryError) {
      console.log('Primary SMTP failed, trying alternative method...');
      lastError = primaryError;
      
      // Try alternative transporter
      transporter = createAlternativeTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to', options.to, 'via alternative method - Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error('Error sending email to', options.to, ':', error.message);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    return { success: false, error: error.message };
  }
};

export default { sendEmail, verifyEmailConfig };
