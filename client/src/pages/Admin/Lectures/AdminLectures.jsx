import { useState, useEffect } from 'react'
import { lectureAPI } from '../../../utils/api'
import PageShell from '../../../components/Layout/PageShell'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminLectures.module.css'

export default function AdminLectures() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [lectures, setLectures] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingLecture, setEditingLecture] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    isPreview: false
  })

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadLectures(selectedCourse)
    }
  }, [selectedCourse])

  const loadCourses = async () => {
    try {
      const data = await lectureAPI.getCourses()
      setCourses(data)
      if (data.length > 0) {
        setSelectedCourse(data[0]._id)
      }
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  const loadLectures = async (courseId) => {
    try {
      const data = await lectureAPI.getLectures(courseId)
      setLectures(data)
    } catch (err) {
      console.error('Failed to load lectures:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingLecture) {
        await lectureAPI.updateLecture(selectedCourse, editingLecture._id, formData)
      } else {
        await lectureAPI.createLecture(selectedCourse, formData)
      }
      setShowForm(false)
      setEditingLecture(null)
      setFormData({ title: '', description: '', videoUrl: '', isPreview: false })
      loadLectures(selectedCourse)
    } catch (err) {
      alert(err.message || 'Failed to save lecture')
    }
  }

  const handleEdit = (lecture) => {
    setEditingLecture(lecture)
    setFormData({
      title: lecture.title,
      description: lecture.description,
      videoUrl: lecture.videoUrl,
      isPreview: lecture.isPreview
    })
    setShowForm(true)
  }

  const handleDelete = async (lectureId) => {
    if (!window.confirm('Delete this lecture?')) return
    try {
      await lectureAPI.deleteLecture(selectedCourse, lectureId)
      loadLectures(selectedCourse)
    } catch (err) {
      alert(err.message || 'Failed to delete lecture')
    }
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Manage Lectures</h1>
            <p className={styles.subtitle}>Curate content, update video details, and control preview access.</p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)} type="button">
            Add Lecture
          </button>
        </div>

        {/* Promote upcoming lecture drops or cohort announcements here - Commented out for v1 */}
        {/* <div className={styles.adPlaceholder}>Promote upcoming lecture drops or cohort announcements here.</div> */}

        <div className={styles.formRow}>
          <label htmlFor="courseSelect" className={styles.courseLabel}>
            Choose Course
          </label>
          <select
            id="courseSelect"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className={styles.courseSelect}
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {showForm && (
          <div className={styles.formModal}>
            <div className={styles.formContent}>
              <h2>{editingLecture ? 'Edit Lecture' : 'New Lecture'}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Video URL</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isPreview}
                      onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
                    />
                    Make Preview
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.lecturesList}>
          {lectures.map((lecture) => (
            <div key={lecture._id} className={styles.lectureItem}>
              <div className={styles.lectureInfo}>
                <h3>{lecture.title}</h3>
                <p>{lecture.description || 'No description provided'}</p>
                <div className={styles.meta}>
                  {lecture.isPreview && <span className={styles.preview}>Preview</span>}
                </div>
              </div>
              <div className={styles.actions}>
                <button onClick={() => handleEdit(lecture)} className={styles.editBtn} type="button">
                  Edit
                </button>
                <button onClick={() => handleDelete(lecture._id)} className={styles.deleteBtn} type="button">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </PageShell>
    </AdminRoute>
  )
}

