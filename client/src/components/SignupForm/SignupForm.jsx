import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../utils/api'
import styles from './SignupForm.module.css'

export default function SignupForm() {
  const [step, setStep] = useState('register') // 'register' or 'verify'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { register, verifyEmail, resendOTP } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const data = await register(name, email, password, phoneNumber)
      if (data.requiresVerification) {
        setStep('verify')
      }
    } catch (err) {
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      await verifyEmail(email, otp)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setResending(true)

    try {
      await resendOTP(email)
      setError('')
      alert('OTP has been resent to your email address.')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className={styles.container}>
        <h1>Verify Your Email</h1>
        {error && <div className={styles.error}>{error}</div>}
        <p className={styles.instruction}>
          We've sent a 6-digit verification code to <strong>{email}</strong>. Please enter the code below to verify your email address.
        </p>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              setOtp(value)
            }}
            maxLength={6}
            required
            className={styles.otpInput}
          />
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          <div className={styles.resendContainer}>
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending}
              className={styles.resendBtn}
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
          <Link to="/login" className={styles.backLink}>Back to Login</Link>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Signup</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number (Optional)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Signup'}
        </button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  )
}
