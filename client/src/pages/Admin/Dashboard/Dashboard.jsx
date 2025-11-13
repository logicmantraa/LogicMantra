import { useState, useEffect } from 'react'
import { adminAPI } from '../../../utils/api'
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

        <div className={styles.adPlaceholder}>Reserved banner for future analytics insights or partner promotions.</div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Users</h3>
            <p className={styles.statValue}>{stats.totalUsers}</p>
            <p className={styles.statChange}>+{stats.newUsers} this month</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Courses</h3>
            <p className={styles.statValue}>{stats.totalCourses}</p>
            <p className={styles.statChange}>Active courses</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Enrollments</h3>
            <p className={styles.statValue}>{stats.totalEnrollments}</p>
            <p className={styles.statChange}>+{stats.recentEnrollments} this week</p>
          </div>
          <div className={styles.statCard}>
            <h3>New Users</h3>
            <p className={styles.statValue}>{stats.newUsers}</p>
            <p className={styles.statChange}>Last 30 days</p>
          </div>
          <div className={styles.statCard}>
            <h3>Recent Enrollments</h3>
            <p className={styles.statValue}>{stats.recentEnrollments}</p>
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
            <h2>Popular Courses</h2>
            {stats.popularCourses.length === 0 ? (
              <p>No courses yet</p>
            ) : (
              <ul className={styles.list}>
                {stats.popularCourses.map((course) => (
                  <li key={course._id}>
                    <strong>{course.title}</strong> – {course.enrolledCount} enrollments
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.section}>
            <h2>Top Rated Courses</h2>
            {stats.topRatedCourses.length === 0 ? (
              <p>No ratings yet</p>
            ) : (
              <ul className={styles.list}>
                {stats.topRatedCourses.map((course) => (
                  <li key={course._id}>
                    <strong>{course.title}</strong> – ★ {course.rating.toFixed(1)} ({course.totalRatings} ratings)
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

