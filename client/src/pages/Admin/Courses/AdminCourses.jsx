import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { courseAPI } from '../../../utils/api'
import PageShell from '../../../components/Layout/PageShell'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminCourses.module.css'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
    isFree: true,
    category: '',
    level: 'Beginner',
    thumbnail: ''
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await courseAPI.getCourses()
      setCourses(data)
    } catch (err) {
      console.error('Failed to load courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        await courseAPI.updateCourse(editingCourse._id, formData)
      } else {
        await courseAPI.createCourse(formData)
      }
      setShowForm(false)
      setEditingCourse(null)
      setFormData({
        title: '',
        description: '',
        instructor: '',
        price: 0,
        isFree: true,
        category: '',
        level: 'Beginner',
        thumbnail: ''
      })
      loadCourses()
    } catch (err) {
      alert(err.message || 'Failed to save course')
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      price: course.price,
      isFree: course.isFree,
      category: course.category,
      level: course.level,
      thumbnail: course.thumbnail || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return
    }

    try {
      await courseAPI.deleteCourse(courseId)
      loadCourses()
    } catch (err) {
      alert(err.message || 'Failed to delete course')
    }
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Courses Control</p>
            <h1>Manage Courses</h1>
          </div>
          <button onClick={() => setShowForm(true)} className={styles.addBtn} type="button">
            Add New Course
          </button>
        </div>

        {/* Spot reserved for promoting upcoming course launches and announcements - Commented out for v1 */}
        {/* <div className={styles.adPlaceholder}>Spot reserved for promoting upcoming course launches and announcements.</div> */}

        {showForm && (
          <div className={styles.formModal}>
            <div className={styles.formContent}>
              <h2>{editingCourse ? 'Edit Course' : 'New Course'}</h2>
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
                    required
                    rows={4}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Instructor</label>
                    <input
                      type="text"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    />
                    Free Course
                  </label>
                </div>
                <div className={styles.formGroup}>
                  <label>Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit">Save</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingCourse(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading courses...</div>
        ) : (
          <div className={styles.coursesList}>
            {courses.map((course) => (
              <div key={course._id} className={styles.courseItem}>
                <div className={styles.courseInfo}>
                  <h3>{course.title}</h3>
                  <p>{course.description.substring(0, 120)}...</p>
                  <div className={styles.meta}>
                    <span>By {course.instructor}</span>
                    <span>{course.category}</span>
                    <span>{course.level}</span>
                    <span>{course.isFree ? 'Free' : `₹${course.price}`}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Link to={`/admin/lectures/${course._id}`} className={styles.manageBtn}>
                    Manage Lectures
                  </Link>
                  <button onClick={() => handleEdit(course)} className={styles.editBtn} type="button">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(course._id)} className={styles.deleteBtn} type="button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </AdminRoute>
  )
}


