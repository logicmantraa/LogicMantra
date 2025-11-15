import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import styles from './ResetPassword.module.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useAuth();
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  
  // Update email if it comes from query params
  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery && !email) {
      setEmail(emailFromQuery);
    }
  }, [searchParams, email]);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.resetPassword(email, otp, newPassword);
      
      // Auto-login user with the returned token
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Load user data to update auth context
        await loadUser();
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <h1>Password Reset Successful!</h1>
        <div className={styles.success}>
          <p>Your password has been reset successfully.</p>
          <p>Redirecting you to the home page...</p>
        </div>
      </div>
    );
  }

  const emailFromQuery = searchParams.get('email');
  const showEmailInfo = !!emailFromQuery;

  return (
    <div className={styles.container}>
      <h1>Reset Password</h1>
      {error && <div className={styles.error}>{error}</div>}
      {showEmailInfo && (
        <div className={styles.info}>
          <p>Check your email for the 6-digit code sent to <strong>{emailFromQuery}</strong></p>
        </div>
      )}
      <p className={styles.instruction}>
        Enter the 6-digit code sent to your email and your new password.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email || emailFromQuery || ''}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || !!emailFromQuery}
        />
        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(value);
          }}
          maxLength={6}
          required
          className={styles.otpInput}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <button type="submit" disabled={loading || otp.length !== 6}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
      <div className={styles.links}>
        <Link to="/forgot-password">Request New Code</Link>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}

