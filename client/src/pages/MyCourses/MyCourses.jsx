import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { enrollmentAPI, courseAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import PageShell from '../../components/Layout/PageShell'
import styles from './MyCourses.module.css'

export default function MyCourses() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])

  useEffect(() => {
    if (!user) return
    const fetchEnrollments = async () => {
      setLoading(true)
      try {
        const [enrollmentData, courseData] = await Promise.all([
          enrollmentAPI.getMyEnrollments(),
          courseAPI.getCourses()
        ])
        setEnrollments(enrollmentData)
        setCourses(courseData)
      } catch (err) {
        console.error('Failed to fetch enrollments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnrollments()
  }, [user])

  const progressPercentage = (progress = 0) => Math.min(100, Math.round(progress))

  const recommendedCourses = courses
    .filter((course) => !enrollments.some((enroll) => enroll.courseId?._id === course._id))
    .slice(0, 4)

  return (
    <PageShell contentClassName={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Your Learning Journey</p>
          <h1 className={styles.title}>Track Progress & Continue Growing</h1>
          <p className={styles.subtitle}>
            Pick up where you left off, explore fresh content, and unlock achievements as you master each topic.
          </p>
        </div>
        <div className={styles.progressBadge}>
          <span className={styles.progressLabel}>Courses in progress</span>
          <span className={styles.progressValue}>{enrollments.length}</span>
        </div>
      </header>

      <div className={styles.adPlaceholder}>Reserved space for personalised offers & upcoming events</div>

      <section className={styles.enrollmentsSection}>
        <div className={styles.sectionHeader}>
          <h2>Continue Learning</h2>
          <Link to="/courses" className={styles.sectionLink}>
            Explore all courses →
          </Link>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading your courses...</div>
        ) : enrollments.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No courses yet</h3>
            <p>Browse our catalogue and start learning today.</p>
            <Link to="/courses" className={styles.primaryBtn}>
              Find a course
            </Link>
          </div>
        ) : (
          <div className={styles.enrollmentGrid}>
            {enrollments.map((enrollment) => (
              <div key={enrollment._id} className={styles.enrollmentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.courseInfo}>
                    <h3>{enrollment.courseId?.title}</h3>
                    <p>{enrollment.courseId?.instructor}</p>
                  </div>
                  <Link to={`/courses/${enrollment.courseId?._id}`} className={styles.viewCourse}>
                    View Course
                  </Link>
                </div>
                <p className={styles.courseDescription}>
                  {(enrollment.courseId?.description || 'No description provided').slice(0, 140)}...
                </p>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercentage(enrollment.progress)}%` }}
                  ></div>
                </div>
                <div className={styles.progressMeta}>
                  <span>{progressPercentage(enrollment.progress)}% complete</span>
                  {enrollment.lastCompletedLecture ? (
                    <span>Last lecture: {enrollment.lastCompletedLecture.title}</span>
                  ) : (
                    <span>Start learning now</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.recommendations}>
        <div className={styles.sectionHeader}>
          <h2>Recommended For You</h2>
        </div>
        {recommendedCourses.length === 0 ? (
          <p className={styles.noRecommendations}>You are all caught up! Explore more courses anytime.</p>
        ) : (
          <div className={styles.recommendationGrid}>
            {recommendedCourses.map((course) => (
              <div key={course._id} className={styles.recommendationCard}>
                <div className={styles.recommendationMeta}>
                  <span className={styles.level}>{course.level}</span>
                  <span className={styles.category}>{course.category || 'General'}</span>
                </div>
                <h3>{course.title}</h3>
                <p>{(course.description || '').slice(0, 120)}...</p>
                <div className={styles.recommendationFooter}>
                  <span className={styles.price}>{course.isFree ? 'Free' : `₹${course.price}`}</span>
                  <Link to={`/courses/${course._id}`} className={styles.secondaryBtn}>
                    View course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}

