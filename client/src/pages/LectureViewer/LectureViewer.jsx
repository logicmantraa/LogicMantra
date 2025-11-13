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

  if (!enrolled && !currentLecture?.isPreview) {
    return (
      <ProtectedRoute>
        <PageShell contentClassName={styles.container}>
          <div className={styles.header}>
            <Link to={`/courses/${courseId}`} className={styles.backLink}>
              ← Back to Course
            </Link>
            <h1>Access Restricted</h1>
            <p className={styles.courseTitle}>Enroll to continue learning.</p>
          </div>
          <div className={styles.contentMessage}>
            <Link to={`/courses/${courseId}`} className={styles.primaryAction}>
              View Course Details
            </Link>
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

