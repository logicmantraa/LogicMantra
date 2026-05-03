import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './VerifyOTP.module.css';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      navigate('/signup');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await verifyOTP(email, otp);
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResending(true);

    try {
      await resendOTP(email);
      setMessage('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Verify Email</h1>
      <p className={styles.instruction}>
        We've sent a 6-digit verification code to <strong>{email}</strong>.
      </p>
      
      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          required
          className={styles.otpInput}
        />
        <button type="submit" disabled={loading || !otp}>
          {loading ? 'Verifying...' : 'Verify & Complete Signup'}
        </button>
      </form>
      
      <div className={styles.resendContainer}>
        <p>Didn't receive the code?</p>
        <button 
          onClick={handleResend} 
          disabled={resending}
          className={styles.resendButton}
        >
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}
