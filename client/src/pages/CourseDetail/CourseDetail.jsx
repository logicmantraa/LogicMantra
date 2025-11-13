import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { courseAPI, enrollmentAPI, ratingAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import PageShell from '../../components/Layout/PageShell'
import Rating from '../../components/Rating/Rating'
import styles from './CourseDetail.module.css'

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [resources, setResources] = useState([])
  const [ratings, setRatings] = useState([])
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    loadCourseData()
    if (user) {
      checkEnrollment()
    }
  }, [id, user])

  const loadCourseData = async () => {
    try {
      const data = await courseAPI.getCourseById(id)
      setCourse(data.course)
      setLectures(data.lectures)
      setResources(data.resources)

      const ratingsData = await ratingAPI.getCourseRatings(id)
      setRatings(ratingsData)
    } catch (err) {
      console.error('Failed to load course:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = async () => {
    try {
      const data = await enrollmentAPI.checkEnrollment(id)
      setEnrolled(data.enrolled)
    } catch (err) {
      console.error('Failed to check enrollment:', err)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      alert('Please login to enroll')
      return
    }

    setEnrolling(true)
    try {
      await enrollmentAPI.enroll(id)
      setEnrolled(true)
      alert('Successfully enrolled!')
    } catch (err) {
      alert(err.message || 'Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleRatingSubmit = () => {
    loadCourseData()
  }

  if (loading) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.loading}>Loading course...</div>
      </PageShell>
    )
  }

  if (!course) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.loading}>Course not found</div>
      </PageShell>
    )
  }

  const averageRating = typeof course.rating === 'number' ? course.rating.toFixed(1) : 'New'
  const ratingCount = course.totalRatings ?? ratings.length

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>{course.title}</h1>
          <p className={styles.instructor}>By {course.instructor}</p>
          <div className={styles.meta}>
            <span>Level: {course.level}</span>
            <span>★ {averageRating} ({ratingCount} ratings)</span>
            <span>{course.isFree ? 'Free' : `₹${course.price}`}</span>
          </div>
        </div>
        <div className={styles.heroBadge}>
          <span>Lectures</span>
          <strong>{lectures.length}</strong>
        </div>
      </div>

      <div className={styles.adPlaceholder}>Future promotional banner — highlight course bundles & partner offers here.</div>

      <div className={styles.content}>
        <div className={styles.main}>
          <div className={styles.section}>
            <h2>Description</h2>
            <p>{course.description}</p>
          </div>

          <div className={styles.section}>
            <h2>Lectures ({lectures.length})</h2>
            {lectures.length === 0 ? (
              <p>No lectures available</p>
            ) : (
              <div className={styles.lectureList}>
                {lectures.map((lecture, index) => (
                  <Link
                    key={lecture._id}
                    to={`/courses/${id}/lectures/${lecture._id}`}
                    className={styles.lectureItem}
                  >
                    <span className={styles.lectureNumber}>{index + 1}</span>
                    <div className={styles.lectureInfo}>
                      <h4>{lecture.title}</h4>
                      <div className={styles.lectureMeta}>
                        {lecture.duration > 0 && (
                          <span className={styles.duration}>{lecture.duration} min</span>
                        )}
                        {lecture.isPreview && <span className={styles.preview}>Preview</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Resources</h2>
            {resources.length === 0 ? (
              <p>No resources available</p>
            ) : (
              <div className={styles.resourceList}>
                {resources.map((resource) => (
                  <a
                    key={resource._id}
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceItem}
                  >
                    {resource.name} ({resource.type})
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Ratings & Reviews</h2>
            {ratings.length === 0 ? (
              <p>No ratings yet</p>
            ) : (
              <div className={styles.ratingsList}>
                {ratings.map((rating) => (
                  <div key={rating._id} className={styles.ratingItem}>
                    <div className={styles.ratingHeader}>
                      <strong>{rating.userId?.name || 'Anonymous'}</strong>
                      <span className={styles.stars}>
                        {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                      </span>
                    </div>
                    {rating.feedback && <p>{rating.feedback}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {user && (
            <div className={styles.section}>
              <Rating courseId={id} onRatingSubmit={handleRatingSubmit} />
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.enrollBox}>
            {enrolled ? (
              <div>
                <h3>You are enrolled</h3>
                {lectures.length > 0 ? (
                  <Link to={`/courses/${id}/lectures/${lectures[0]._id}`} className={styles.startBtn}>
                    Start Learning
                  </Link>
                ) : (
                  <p>No lectures available yet</p>
                )}
              </div>
            ) : (
              <div>
                <h3>{course.isFree ? 'Free Course' : `₹${course.price}`}</h3>
                <button onClick={handleEnroll} disabled={enrolling} className={styles.enrollBtn}>
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
                {!course.isFree && (
                  <p className={styles.note}>Payment integration coming soon</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.courseMetaBox}>
            <h4>Course Highlights</h4>
            <ul>
              <li>{lectures.length} video lectures</li>
              <li>{resources.length} downloadable resources</li>
              <li>Lifetime access & updates</li>
              <li>Certificate of completion</li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}

