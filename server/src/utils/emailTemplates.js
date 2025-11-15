// Email templates for different notification types

export const welcomeEmailTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Logic Mantraa! 🎉</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName}!</h2>
        <p>Thank you for joining Logic Mantraa! We're excited to have you on board.</p>
        <p>You now have access to:</p>
        <ul>
          <li>Browse and enroll in our comprehensive courses</li>
          <li>Access video lectures and downloadable resources</li>
          <li>Track your learning progress</li>
          <li>Connect with our learning community</li>
        </ul>
        <p>Ready to start learning? Explore our courses and begin your journey!</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/courses" class="button">Browse Courses</a>
        <p>If you have any questions, feel free to reach out to us.</p>
        <p>Happy Learning!<br>The Logic Mantraa Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa. All rights reserved.</p>
        <p>91/4 Knowledge Park, Bengaluru, India</p>
      </div>
    </body>
    </html>
  `;
};

export const contactConfirmationEmailTemplate = (name, intent, message) => {
  const intentLabels = {
    learn: 'I want to learn',
    teach: 'I want to teach',
    partner: 'We want to partner'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .message-box {
          background: white;
          padding: 20px;
          border-left: 4px solid #0ea5e9;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thank You for Contacting Us! 📧</h1>
      </div>
      <div class="content">
        <h2>Hello ${name}!</h2>
        <p>We've received your message and our team will get back to you within a few hours.</p>
        <div class="message-box">
          <p><strong>Your Intent:</strong> ${intentLabels[intent] || intent}</p>
          <p><strong>Your Message:</strong></p>
          <p>${message}</p>
        </div>
        <p>We typically respond within 3 hours during business hours. If your inquiry is urgent, please call us directly.</p>
        <p>Best regards,<br>The Logic Mantraa Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa. All rights reserved.</p>
        <p>91/4 Knowledge Park, Bengaluru, India | hello@logicmantraa.com</p>
      </div>
    </body>
    </html>
  `;
};

export const contactAdminNotificationTemplate = (contact) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .info-box {
          background: white;
          padding: 20px;
          border-left: 4px solid #0ea5e9;
          margin: 15px 0;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Contact Submission 📬</h1>
      </div>
      <div class="content">
        <p>A new contact form submission has been received:</p>
        <div class="info-box">
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
          <p><strong>Intent:</strong> ${contact.intent}</p>
          <p><strong>Message:</strong></p>
          <p>${contact.message}</p>
          <p><strong>Submitted:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/contacts" class="button">View in Admin Panel</a>
        <p>Please review and respond to this inquiry.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa Admin Panel</p>
      </div>
    </body>
    </html>
  `;
};

export const enrollmentConfirmationEmailTemplate = (userName, courseTitle) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .course-box {
          background: white;
          padding: 20px;
          border-left: 4px solid #0ea5e9;
          margin: 20px 0;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Enrollment Confirmed! 🎓</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName}!</h2>
        <p>Congratulations! You've successfully enrolled in:</p>
        <div class="course-box">
          <h3>${courseTitle}</h3>
        </div>
        <p>You can now access all course materials, lectures, and resources. Start your learning journey today!</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-courses" class="button">Go to My Courses</a>
        <p>Happy Learning!<br>The Logic Mantraa Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const otpVerificationEmailTemplate = (userName, otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .otp-box {
          background: white;
          border: 3px dashed #0ea5e9;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: 10px;
          color: #0ea5e9;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          color: #92400e;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Verify Your Email Address 🔐</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName}!</h2>
        <p>Thank you for signing up for Logic Mantraa! To complete your registration, please verify your email address using the OTP below.</p>
        <div class="otp-box">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 0.9rem;">Your verification code is:</p>
          <div class="otp-code">${otp}</div>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 0.85rem;">This code will expire in 10 minutes</p>
        </div>
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Logic Mantraa staff will never ask for your verification code.
        </div>
        <p>If you didn't create an account with Logic Mantraa, please ignore this email.</p>
        <p>Best regards,<br>The Logic Mantraa Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa. All rights reserved.</p>
        <p>91/4 Knowledge Park, Bengaluru, India</p>
      </div>
    </body>
    </html>
  `;
};

export const passwordResetEmailTemplate = (userName, otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .otp-box {
          background: white;
          border: 3px dashed #ef4444;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: 10px;
          color: #ef4444;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          color: #92400e;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reset Your Password 🔒</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName}!</h2>
        <p>We received a request to reset your password for your Logic Mantraa account. Use the OTP below to verify your identity and set a new password.</p>
        <div class="otp-box">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 0.9rem;">Your password reset code is:</p>
          <div class="otp-code">${otp}</div>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 0.85rem;">This code will expire in 10 minutes</p>
        </div>
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> Never share this code with anyone. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        </div>
        <p>After verifying the code, you'll be able to set a new password for your account.</p>
        <p>Best regards,<br>The Logic Mantraa Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa. All rights reserved.</p>
        <p>91/4 Knowledge Park, Bengaluru, India</p>
      </div>
    </body>
    </html>
  `;
};

export const courseCompletionEmailTemplate = (userName, courseTitle) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .course-box {
          background: white;
          padding: 20px;
          border-left: 4px solid #22c55e;
          margin: 20px 0;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Course Completed! 🎉</h1>
      </div>
      <div class="content">
        <h2>Congratulations ${userName}!</h2>
        <p>You've successfully completed the course:</p>
        <div class="course-box">
          <h3>${courseTitle}</h3>
        </div>
        <p>This is a significant achievement! You've demonstrated dedication and commitment to your learning journey.</p>
        <p>Your certificate of completion is available in your course dashboard.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-courses" class="button">View Certificate</a>
        <p>Keep up the great work and continue learning!</p>
        <p>Best regards,<br>The Logic Mantraa Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Logic Mantraa. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

