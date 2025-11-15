import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.forgotPassword(email);
      // Navigate to reset password page with email as query parameter
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Failed to send password reset code');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Forgot Password</h1>
      {error && <div className={styles.error}>{error}</div>}
      <p className={styles.instruction}>
        Enter your email address and we'll send you a code to reset your password.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>
      <div className={styles.links}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}

