export const getOTPEmailTemplate = (otp, name, type = 'registration') => {
  const subject = type === 'registration' 
    ? 'Verify Your Email - Logic Mantraa' 
    : 'Reset Your Password - Logic Mantraa';
    
  const title = type === 'registration' 
    ? 'Email Verification' 
    : 'Password Reset Request';
    
  const message = type === 'registration'
    ? 'Thank you for signing up with Logic Mantraa. Please use the following OTP to verify your email address.'
    : 'We received a request to reset your password. Please use the following OTP to complete the process.';

  return {
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a90e2; margin: 0;">Logic Mantraa</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="color: #333; margin-top: 0;">${title}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">${message}</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4a90e2; padding: 10px 20px; background: #fff; border: 2px dashed #4a90e2; border-radius: 5px;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Logic Mantraa. All rights reserved.
        </div>
      </div>
    `
  };
};
