import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../utils/api'
import PageShell from '../../components/Layout/PageShell'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', bio: '', occupation: '', location: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordUpdating, setPasswordUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await authAPI.getProfile()
        setProfile(data)
        setFormData({
          name: data?.name || '',
          email: data?.email || '',
          bio: data?.bio || '',
          occupation: data?.occupation || '',
          location: data?.location || ''
        })
      } catch (err) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setUpdating(true)
    setMessage('')
    setError('')
    try {
      const updated = await authAPI.updateProfile(formData)
      setProfile(updated)
      setEditing(false)
      setMessage('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordUpdating(true)
    setMessage('')
    setError('')
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setPasswordUpdating(false)
      return
    }
    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessage('Password updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setPasswordUpdating(false)
    }
  }

  if (loading) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </PageShell>
    )
  }

  return (
    <PageShell contentClassName={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Welcome back</p>
          <h1 className={styles.title}>Manage Your Learning Identity</h1>
          <p className={styles.subtitle}>
            Update your personal details, adjust security preferences, and keep your profile up to date.
          </p>
        </div>
        <div className={styles.quickActions}>
          <button className={styles.logoutBtn} onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>

      <div className={styles.adPlaceholder}>Future personalisation spot — showcase achievements or tailored offers here.</div>

      {(message || error) && (
        <div className={`${styles.alert} ${error ? styles.error : styles.success}`}>
          {error || message}
        </div>
      )}

      <section className={styles.profileSection}>
        <div className={styles.profileCard}>
          <div className={styles.avatarCircle}>
            {(profile?.name || user?.name || 'LM')[0]?.toUpperCase()}
          </div>
          <h2>{profile?.name || 'Learner'}</h2>
          <p className={styles.email}>{profile?.email}</p>
          <div className={styles.metaGrid}>
            <div>
              <span className={styles.metaLabel}>Role</span>
              <span className={styles.metaValue}>{user?.isAdmin ? 'Admin' : 'Student'}</span>
            </div>
            <div>
              <span className={styles.metaLabel}>Occupation</span>
              <span className={styles.metaValue}>{profile?.occupation || '—'}</span>
            </div>
            <div>
              <span className={styles.metaLabel}>Location</span>
              <span className={styles.metaValue}>{profile?.location || '—'}</span>
            </div>
          </div>
          <button className={styles.editBtn} onClick={() => setEditing((prev) => !prev)} type="button">
            {editing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        <div className={styles.formsColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Profile Details</h3>
              <span className={styles.cardSubtitle}>Keep your personal information accurate and current.</span>
            </div>
            <form onSubmit={handleProfileSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editing}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    id="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditing(false)} disabled={!editing}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={!editing || updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Security</h3>
              <span className={styles.cardSubtitle}>Update your password to keep your account secure.</span>
            </div>
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn} disabled={passwordUpdating}>
                  {passwordUpdating ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

