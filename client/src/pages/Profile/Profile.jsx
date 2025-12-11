import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authAPI, paymentAPI } from '../../utils/api'
import PageShell from '../../components/Layout/PageShell'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, logout, updateProfile: updateUserProfile, updatePassword: updateUserPassword } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordUpdating, setPasswordUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeSection, setActiveSection] = useState('profile') // 'profile', 'security', 'orders', 'account'

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await authAPI.getProfile()
        setProfile(data)
        setFormData({
          name: data?.name || '',
          email: data?.email || '',
          phoneNumber: data?.phoneNumber || ''
        })
      } catch (err) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const data = await paymentAPI.getMyOrders()
      setOrders(data)
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

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
      const updated = await updateUserProfile(formData)
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
      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword)
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
      </header>

      {/* Future personalisation spot — showcase achievements or tailored offers here - Commented out for v1 */}
      {/* <div className={styles.adPlaceholder}>Future personalisation spot — showcase achievements or tailored offers here.</div> */}

      {(message || error) && (
        <div className={`${styles.alert} ${error ? styles.error : styles.success}`}>
          {error || message}
        </div>
      )}

      <section className={styles.profileSection}>
        <div className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.avatarCircle}>
              {(profile?.name || user?.name || 'LM')[0]?.toUpperCase()}
            </div>
            <h2>{profile?.name || 'Learner'}</h2>
            <p className={styles.email}>{profile?.email}</p>
            {profile?.phoneNumber && (
              <p className={styles.phoneNumber}>{profile.phoneNumber}</p>
            )}
            <div className={styles.metaGrid}>
              <div>
                <span className={styles.metaLabel}>Role</span>
                <span className={styles.metaValue}>{user?.isAdmin ? 'Admin' : 'Student'}</span>
              </div>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            <button
              onClick={() => setActiveSection('profile')}
              className={`${styles.navButton} ${activeSection === 'profile' ? styles.active : ''}`}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Profile Details
            </button>
            <button
              onClick={() => setActiveSection('security')}
              className={`${styles.navButton} ${activeSection === 'security' ? styles.active : ''}`}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Security
            </button>
            <button
              onClick={() => setActiveSection('orders')}
              className={`${styles.navButton} ${activeSection === 'orders' ? styles.active : ''}`}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Order History
            </button>
            <button
              onClick={() => setActiveSection('account')}
              className={`${styles.navButton} ${activeSection === 'account' ? styles.active : ''}`}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Account
            </button>
          </nav>
        </div>

        <div className={styles.contentArea}>
          {activeSection === 'profile' && (
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
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!editing}
                      required
                    />
                    {editing && (
                      <span className={styles.fieldHint}>Note: Changing email will update your login credentials</span>
                    )}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!editing}
                    placeholder="Enter your phone number (optional)"
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
                {!editing && (
                  <button type="button" className={styles.editBtn} onClick={() => setEditing(true)}>
                    Edit Profile
                  </button>
                )}
              </form>
            </div>
          )}

          {activeSection === 'security' && (
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
          )}

          {activeSection === 'orders' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Order History</h3>
                <span className={styles.cardSubtitle}>View all your past purchases and invoices.</span>
              </div>
              {ordersLoading ? (
                <div className={styles.loadingText}>Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No orders yet. Start shopping to see your order history here.</p>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {orders.map((order) => (
                    <div key={order._id} className={styles.orderItem}>
                      <div className={styles.orderHeader}>
                        <div>
                          <h4>Order #{order.orderId}</h4>
                          <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                        </div>
                        <div className={styles.orderMeta}>
                          <span className={`${styles.status} ${styles[order.paymentStatus]}`}>
                            {order.paymentStatus}
                          </span>
                          <strong className={styles.orderTotal}>{formatCurrency(order.totalAmount)}</strong>
                        </div>
                      </div>
                      <div className={styles.orderItems}>
                        <p className={styles.itemsLabel}>Items ({order.items?.length || 0}):</p>
                        <ul>
                          {order.items?.map((item, idx) => (
                            <li key={idx}>
                              {item.name} - {formatCurrency(item.price)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles.orderActions}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={styles.viewDetailsBtn}
                          type="button"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'account' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Account Actions</h3>
                <span className={styles.cardSubtitle}>Manage your account settings.</span>
              </div>
              <div className={styles.accountActions}>
                <button onClick={handleLogout} className={styles.logoutBtn} type="button">
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeModal} type="button">
                ×
              </button>
            </div>
            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span>Order ID:</span>
                <strong>{selectedOrder.orderId}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Date:</span>
                <span>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Payment Status:</span>
                <span className={`${styles.status} ${styles[selectedOrder.paymentStatus]}`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span>Payment Method:</span>
                <span>{selectedOrder.paymentMethod}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Total Amount:</span>
                <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>
              <div className={styles.itemsSection}>
                <h4>Items:</h4>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.itemType}</td>
                        <td>{formatCurrency(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2"><strong>Total</strong></td>
                      <td><strong>{formatCurrency(selectedOrder.totalAmount)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

