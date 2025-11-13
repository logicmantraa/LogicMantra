import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { courseAPI, enrollmentAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import PageShell from '../../components/Layout/PageShell'
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute'
import styles from './LectureViewer.module.css'

export default function LectureViewer() {
  const { courseId, lectureId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [currentLecture, setCurrentLecture] = useState(null)
  const [resources, setResources] = useState([])
  const [enrolled, setEnrolled] = useState(false)
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [courseId, lectureId])

  const loadData = async () => {
    try {
      const courseData = await courseAPI.getCourseById(courseId)
      setCourse(courseData.course)
      setLectures(courseData.lectures)

      const lecture = courseData.lectures.find((l) => l._id === lectureId)
      setCurrentLecture(lecture)

      const lectureResources = courseData.resources.filter((r) => r.lectureId === lectureId)
      setResources(lectureResources)

      if (user) {
        const enrollmentData = await enrollmentAPI.checkEnrollment(courseId)
        setEnrolled(enrollmentData.enrolled)
        setEnrollment(enrollmentData.enrollment)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ''
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const getCurrentIndex = () => {
    return lectures.findIndex((l) => l._id === lectureId)
  }

  const goToNext = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex < lectures.length - 1) {
      navigate(`/courses/${courseId}/lectures/${lectures[currentIndex + 1]._id}`)
    }
  }

  const goToPrevious = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex > 0) {
      navigate(`/courses/${courseId}/lectures/${lectures[currentIndex - 1]._id}`)
    }
  }

  const markAsComplete = async () => {
    if (!enrolled || !currentLecture || !enrollment) return

    try {
      // Backend will automatically calculate progress based on completed lectures / total lectures
      await enrollmentAPI.updateProgress(enrollment._id, currentLecture._id)

      // Reload enrollment data to get updated progress
      const enrollmentData = await enrollmentAPI.checkEnrollment(courseId)
      setEnrollment(enrollmentData.enrollment)

      alert('Lecture marked as complete!')
    } catch (err) {
      console.error('Failed to mark as complete:', err)
      alert(err.message || 'Failed to mark as complete')
    }
  }

  const loadingState = (
    <PageShell contentClassName={styles.container}>
      <div className={styles.header}>
        <div className={styles.backLink}>Loading...</div>
      </div>
    </PageShell>
  )

  if (loading) {
    return <ProtectedRoute>{loadingState}</ProtectedRoute>
  }

  const handleEnroll = async () => {
    if (!user) {
      alert('Please login to enroll')
      return
    }

    try {
      await enrollmentAPI.enroll(courseId)
      setEnrolled(true)
      alert('Successfully enrolled! You can now access the course content.')
      // Reload data to show the lecture
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to enroll')
    }
  }

  if (!enrolled && !currentLecture?.isPreview) {
    return (
      <ProtectedRoute>
        <PageShell contentClassName={styles.container}>
          <div className={styles.header}>
            <Link to={`/courses/${courseId}`} className={styles.backLink}>
              ← Back to Course
            </Link>
          </div>
          
          <div className={styles.restrictedContainer}>
            <div className={styles.restrictedIcon}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.3"/>
                <path d="M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm0 20c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
              </svg>
            </div>
            
            <h1 className={styles.restrictedTitle}>Enroll to Access Course Content</h1>
            <p className={styles.restrictedSubtitle}>
              This course requires enrollment. Join now to unlock all lectures, resources, and start your learning journey!
            </p>

            {course && (
              <div className={styles.coursePreview}>
                <div className={styles.coursePreviewHeader}>
                  <h2>{course.title}</h2>
                  <p className={styles.instructor}>By {course.instructor}</p>
                </div>
                
                <div className={styles.courseStats}>
                  <div className={styles.statItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>{lectures.length} Lectures</span>
                  </div>
                  <div className={styles.statItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>{resources.length} Resources</span>
                  </div>
                  <div className={styles.statItem}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span>{course.level || 'All Levels'}</span>
                  </div>
                  {course.rating && (
                    <div className={styles.statItem}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>{course.rating.toFixed(1)} Rating</span>
                    </div>
                  )}
                </div>

                {course.description && (
                  <p className={styles.courseDescription}>{course.description}</p>
                )}
              </div>
            )}

            <div className={styles.benefits}>
              <h3>What you'll get:</h3>
              <div className={styles.benefitsList}>
                <div className={styles.benefitItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Access to all {lectures.length} video lectures</span>
                </div>
                <div className={styles.benefitItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Downloadable resources and practice materials</span>
                </div>
                <div className={styles.benefitItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Track your progress and earn certificates</span>
                </div>
                <div className={styles.benefitItem}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Lifetime access to course updates</span>
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button onClick={handleEnroll} className={styles.enrollBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                {course?.isFree ? 'Enroll for Free' : `Enroll Now - ${course?.price ? `₹${course.price}` : 'Paid'}`}
              </button>
              <Link to={`/courses/${courseId}`} className={styles.viewDetailsBtn}>
                View Full Course Details
              </Link>
            </div>
          </div>
        </PageShell>
      </ProtectedRoute>
    )
  }

  if (!currentLecture) {
    return (
      <ProtectedRoute>
        <PageShell contentClassName={styles.container}>
          <div className={styles.header}>
            <Link to={`/courses/${courseId}`} className={styles.backLink}>
              ← Back to Course
            </Link>
            <h1>Lecture not found</h1>
            <p className={styles.courseTitle}>{course?.title}</p>
          </div>
        </PageShell>
      </ProtectedRoute>
    )
  }

  const currentIndex = getCurrentIndex()
  const videoUrl = getYouTubeEmbedUrl(currentLecture.videoUrl)

  return (
    <ProtectedRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <Link to={`/courses/${courseId}`} className={styles.backLink}>
            ← Back to Course
          </Link>
          <h1>{currentLecture.title}</h1>
          <p className={styles.courseTitle}>{course?.title}</p>
        </div>

        <div className={styles.adPlaceholder}>Space for future ads or course highlights</div>

        <div className={styles.content}>
          <div className={styles.videoSection}>
            <div className={styles.videoWrapper}>
              {videoUrl ? (
                <iframe
                  src={videoUrl}
                  title={currentLecture.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className={styles.noVideo}>Video URL not available</div>
              )}
            </div>
            <div className={styles.videoInfo}>
              <h2>{currentLecture.title}</h2>
              {currentLecture.description && <p>{currentLecture.description}</p>}
              {enrollment?.completedLectures?.includes(currentLecture._id) ? (
                <div className={styles.completedTag}>✓ Completed</div>
              ) : (
                <button onClick={markAsComplete} className={styles.completeBtn}>
                  Mark as Complete
                </button>
              )}
            </div>

            {resources.length > 0 && (
              <div className={styles.resources}>
                <h3>Resources</h3>
                {resources.map((resource) => (
                  <a
                    key={resource._id}
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceLink}
                  >
                    {resource.name} ({resource.type})
                  </a>
                ))}
              </div>
            )}

            <div className={styles.navigation}>
              <button onClick={goToPrevious} disabled={currentIndex === 0} className={styles.navBtn}>
                ← Previous
              </button>
              <span>
                {currentIndex + 1} / {lectures.length}
              </span>
              <button
                onClick={goToNext}
                disabled={currentIndex === lectures.length - 1}
                className={styles.navBtn}
              >
                Next →
              </button>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <h3>Course Lectures</h3>
            <div className={styles.lectureList}>
              {lectures.map((lecture, index) => (
                <Link
                  key={lecture._id}
                  to={`/courses/${courseId}/lectures/${lecture._id}`}
                  className={`${styles.lectureItem} ${lecture._id === lectureId ? styles.active : ''}`}
                >
                  <span className={styles.lectureNumber}>{index + 1}</span>
                  <span className={styles.lectureTitle}>{lecture.title}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}

