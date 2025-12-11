import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { courseAPI, enrollmentAPI, ratingAPI, lectureAPI, resourceAPI } from '../../utils/api'
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
  const [showLectureModal, setShowLectureModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [editingLecture, setEditingLecture] = useState(null)
  const [editingResource, setEditingResource] = useState(null)
  const [savingLecture, setSavingLecture] = useState(false)
  const [savingResource, setSavingResource] = useState(false)
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    order: 1,
    isPreview: false
  })
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'notes',
    fileUrl: '',
    lectureId: ''
  })

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

  const openLectureModal = () => {
    setEditingLecture(null)
    setLectureForm({
      title: '',
      description: '',
      videoUrl: '',
      order: lectures.length + 1,
      isPreview: false
    })
    setShowLectureModal(true)
  }

  const openEditLectureModal = (lecture) => {
    setEditingLecture(lecture)
    setLectureForm({
      title: lecture.title || '',
      description: lecture.description || '',
      videoUrl: lecture.videoUrl || '',
      order: lecture.order || 1,
      isPreview: Boolean(lecture.isPreview)
    })
    setShowLectureModal(true)
  }

  const closeLectureModal = () => {
    setShowLectureModal(false)
    setEditingLecture(null)
  }

  const openResourceModal = () => {
    setEditingResource(null)
    setResourceForm({
      name: '',
      type: 'notes',
      fileUrl: '',
      lectureId: ''
    })
    setShowResourceModal(true)
  }

  const openEditResourceModal = (resource) => {
    setEditingResource(resource)
    setResourceForm({
      name: resource.name || '',
      type: resource.type || 'notes',
      fileUrl: resource.fileUrl || '',
      lectureId: resource.lectureId?._id || resource.lectureId || ''
    })
    setShowResourceModal(true)
  }

  const closeResourceModal = () => {
    setShowResourceModal(false)
    setEditingResource(null)
  }

  const submitLecture = async (event) => {
    event.preventDefault()
    setSavingLecture(true)
    try {
      const payload = {
        ...lectureForm,
        courseId: id,
        order: Number(lectureForm.order) || lectures.length + 1
      }
      if (editingLecture) {
        await lectureAPI.updateLecture(editingLecture._id, payload)
      } else {
        await lectureAPI.createLecture(payload)
      }
      closeLectureModal()
      await loadCourseData()
    } catch (err) {
      alert(err.message || 'Failed to save lecture')
    } finally {
      setSavingLecture(false)
    }
  }

  const submitResource = async (event) => {
    event.preventDefault()
    setSavingResource(true)
    try {
      const payload = {
        ...resourceForm,
        courseId: id,
        lectureId: resourceForm.lectureId || null
      }
      if (editingResource) {
        await resourceAPI.updateResource(editingResource._id, payload)
      } else {
        await resourceAPI.createResource(payload)
      }
      closeResourceModal()
      await loadCourseData()
    } catch (err) {
      alert(err.message || 'Failed to save resource')
    } finally {
      setSavingResource(false)
    }
  }

  const handleResourceDelete = async (resource) => {
    if (!window.confirm(`Delete "${resource.name}"?`)) return
    try {
      await resourceAPI.deleteResource(resource._id)
      await loadCourseData()
    } catch (err) {
      alert(err.message || 'Failed to delete resource')
    }
  }

  const handleLectureDelete = async (lecture) => {
    if (!window.confirm(`Delete lecture "${lecture.title}"?`)) return
    try {
      await lectureAPI.deleteLecture(lecture._id)
      await loadCourseData()
    } catch (err) {
      alert(err.message || 'Failed to delete lecture')
    }
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

      {/* Future promotional banner — highlight course bundles & partner offers here - Commented out for v1 */}
      {/* <div className={styles.adPlaceholder}>Future promotional banner — highlight course bundles & partner offers here.</div> */}

      <div className={styles.content}>
        <div className={styles.main}>
          <div className={styles.section}>
            <h2>Description</h2>
            <p>{course.description}</p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Lectures ({lectures.length})</h2>
              {user?.isAdmin && (
                <button className={styles.sectionAction} onClick={openLectureModal} type="button">
                  + Add Lecture
                </button>
              )}
            </div>
            {lectures.length === 0 ? (
              <p>No lectures available</p>
            ) : (
              <div className={styles.lectureList}>
                {lectures.map((lecture, index) => (
                  <div key={lecture._id} className={styles.lectureItem}>
                    <Link
                      to={`/courses/${id}/lectures/${lecture._id}`}
                      className={styles.lectureLink}
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
                    {user?.isAdmin && (
                      <div className={styles.inlineActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Edit lecture"
                          onClick={() => openEditLectureModal(lecture)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.delete}`}
                          aria-label="Delete lecture"
                          onClick={() => handleLectureDelete(lecture)}
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Resources</h2>
              {user?.isAdmin && (
                <button className={styles.sectionAction} onClick={openResourceModal} type="button">
                  + Add Resource
                </button>
              )}
            </div>
            {resources.length === 0 ? (
              <p>No resources available</p>
            ) : (
              <div className={styles.resourceList}>
                {resources.map((resource) => (
                  <div key={resource._id} className={styles.resourceItemWrapper}>
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.resourceItem}
                    >
                      {resource.name} ({resource.type})
                    </a>
                    {user?.isAdmin && (
                      <div className={styles.resourceActions}>
                        <button
                          type="button"
                          className={styles.resourceActionBtn}
                          onClick={() => openEditResourceModal(resource)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className={`${styles.resourceActionBtn} ${styles.delete}`}
                          onClick={() => handleResourceDelete(resource)}
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
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
              <li>{resources.length} resources</li>
              <li>Lifetime access & updates</li>
              <li>Certificate of completion</li>
            </ul>
          </div>
        </aside>
      </div>

      {showLectureModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeLectureModal()}>
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h2>{editingLecture ? 'Edit Lecture' : 'Add Lecture'}</h2>
              <button onClick={closeLectureModal} type="button">×</button>
            </div>
            <form className={styles.modalForm} onSubmit={submitLecture}>
              <label>
                Title
                <input
                  type="text"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>
              <label>
                Video URL
                <input
                  type="url"
                  value={lectureForm.videoUrl}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  required
                />
              </label>
              <label>
                Order
                <input
                  type="number"
                  min="1"
                  value={lectureForm.order}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, order: e.target.value }))}
                  required
                />
              </label>
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={lectureForm.isPreview}
                  onChange={(e) => setLectureForm((prev) => ({ ...prev, isPreview: e.target.checked }))}
                />
                Mark as preview
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeLectureModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={savingLecture}>
                  {savingLecture ? 'Saving…' : editingLecture ? 'Update Lecture' : 'Save Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeResourceModal()}>
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h2>{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>
              <button onClick={closeResourceModal} type="button">×</button>
            </div>
            <form className={styles.modalForm} onSubmit={submitResource}>
              <label>
                Name
                <input
                  type="text"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Resource Type
                <select
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="notes">Notes</option>
                  <option value="practice">Practice</option>
                </select>
              </label>
              <label>
                File URL
                <input
                  type="url"
                  value={resourceForm.fileUrl}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                  required
                />
              </label>
              <label>
                Attach to Lecture (optional)
                <select
                  value={resourceForm.lectureId}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, lectureId: e.target.value }))}
                >
                  <option value="">No lecture linked</option>
                  {lectures.map((lecture) => (
                    <option value={lecture._id} key={lecture._id}>
                      {lecture.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeResourceModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={savingResource}>
                  {savingResource ? 'Saving…' : editingResource ? 'Update Resource' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.addSpace}></div>
    </PageShell>
  )
}

