import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productAPI } from '../../../utils/api'
import PageShell from '../../../components/Layout/PageShell'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminRoute>
        <PageShell contentClassName={styles.container}>
          <div className={styles.loading}>Loading dashboard...</div>
        </PageShell>
      </AdminRoute>
    )
  }

  if (!stats) {
    return (
      <AdminRoute>
        <PageShell contentClassName={styles.container}>
          <div className={styles.loading}>Failed to load statistics</div>
        </PageShell>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Admin Dashboard</h1>
            <p className={styles.subtitle}>Welcome back! Here's what's happening with your platform.</p>
          </div>
          <div className={styles.kpiBadge}>
            <span>Monthly Revenue</span>
            <strong>₹{stats.totalRevenue}</strong>
          </div>
        </div>

        {/* Reserved banner for future analytics insights or partner promotions - Commented out for v1 */}
        {/* <div className={styles.adPlaceholder}>Reserved banner for future analytics insights or partner promotions.</div> */}

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Users</h3>
            <p className={styles.statValue}>{stats.totalUsers}</p>
            <p className={styles.statChange}>+{stats.newUsers} this month</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Products</h3>
            <p className={styles.statValue}>{stats.totalProducts}</p>
            <p className={styles.statChange}>Active products</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Access</h3>
            <p className={styles.statValue}>{stats.totalAccess}</p>
            <p className={styles.statChange}>+{stats.recentAccess} this week</p>
          </div>
          <div className={styles.statCard}>
            <h3>New Users</h3>
            <p className={styles.statValue}>{stats.newUsers}</p>
            <p className={styles.statChange}>Last 30 days</p>
          </div>
          <div className={styles.statCard}>
            <h3>Recent Access</h3>
            <p className={styles.statValue}>{stats.recentAccess}</p>
            <p className={styles.statChange}>Last 7 days</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Revenue</h3>
            <p className={styles.statValue}>₹{stats.totalRevenue}</p>
            <p className={styles.statChange}>All time</p>
          </div>
        </div>

        <div className={styles.sections}>
          <div className={styles.section}>
            <h2>Popular Products</h2>
            {stats.popularProducts.length === 0 ? (
              <p>No products yet</p>
            ) : (
              <ul className={styles.list}>
                {stats.popularProducts.map((product) => (
                  <li key={product._id}>
                    <strong>{product.title}</strong> – {product.accessCount} users
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <h2>Top Rated Products</h2>
            {stats.topRatedProducts.length === 0 ? (
              <p>No ratings yet</p>
            ) : (
              <ul className={styles.list}>
                {stats.topRatedProducts.map((product) => (
                  <li key={product._id}>
                    <strong>{product.title}</strong> – ★ {product.rating.toFixed(1)} ({product.totalRatings} ratings)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageShell>
    </AdminRoute>
  )
}

