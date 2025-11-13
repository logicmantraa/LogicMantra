import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { courseAPI } from '../../utils/api'
import PageShell from '../../components/Layout/PageShell'
import SearchBar from '../../components/SearchBar/SearchBar'
import FilterPanel from '../../components/FilterPanel/FilterPanel'
import styles from './Courses.module.css'

const initialCourseForm = {
  title: '',
  description: '',
  instructor: '',
  price: 0,
  isFree: true,
  category: '',
  level: 'Beginner',
  thumbnail: '',
  duration: 0
}

export default function Courses() {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.isAdmin)

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [courseForm, setCourseForm] = useState(initialCourseForm)
  const [editingCourse, setEditingCourse] = useState(null)
  const [savingCourse, setSavingCourse] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [searchTerm, filters])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const params = { search: searchTerm, ...filters }
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })
      const data = await courseAPI.getCourses(params)
      setCourses(data)
    } catch (err) {
      console.error('Failed to load courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const openCourseModal = (course = null) => {
    if (course) {
      setEditingCourse(course)
      setCourseForm({
        title: course.title || '',
        description: course.description || '',
        instructor: course.instructor || '',
        price: course.price || 0,
        isFree: course.isFree ?? false,
        category: course.category || '',
        level: course.level || 'Beginner',
        thumbnail: course.thumbnail || '',
        duration: course.duration || 0
      })
    } else {
      setEditingCourse(null)
      setCourseForm(initialCourseForm)
    }
    setShowCourseModal(true)
  }

  const closeCourseModal = () => {
    setShowCourseModal(false)
    setEditingCourse(null)
    setCourseForm(initialCourseForm)
  }

  const handleCourseChange = (field, value) => {
    setCourseForm((prev) => ({
      ...prev,
      [field]: field === 'price' || field === 'duration' ? Number(value) : value
    }))
  }

  const handleCourseSubmit = async (event) => {
    event.preventDefault()
    setSavingCourse(true)
    try {
      if (editingCourse) {
        await courseAPI.updateCourse(editingCourse._id, courseForm)
      } else {
        await courseAPI.createCourse(courseForm)
      }
      await loadCourses()
      closeCourseModal()
    } catch (err) {
      alert(err.message || 'Failed to save course')
    } finally {
      setSavingCourse(false)
    }
  }

  const handleCourseDelete = async (course) => {
    if (!window.confirm(`Delete course "${course.title}"?`)) return
    try {
      await courseAPI.deleteCourse(course._id)
      await loadCourses()
    } catch (err) {
      alert(err.message || 'Failed to delete course')
    }
  }

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.kicker}>Explore</p>
          <h1 className={styles.title}>Discover Courses Crafted For Impact</h1>
          <p className={styles.subtitle}>
            Browse courses tailored to boost your skills. Filter by level, category, or rating to find the perfect match.
          </p>
        </div>
        {!loading && courses.length > 0 && (
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{courses.length}</span>
              <span className={styles.statLabel}>Courses</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{courses.filter((course) => course.isFree).length}</span>
              <span className={styles.statLabel}>Free</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by course name, instructor, or keyword..."
          className={styles.search}
        />
        <div className={styles.controlButtons}>
          <button
            className={styles.filterToggle}
            onClick={() => setFiltersOpen((prev) => !prev)}
            type="button"
          >
            <span>Advanced Filters</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6H20M6 12H18M10 18H14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {isAdmin && (
            <button className={styles.addCourseBtn} onClick={() => openCourseModal()} type="button">
              + Add Course
            </button>
          )}
        </div>
      </div>

      <div className={`${styles.filterPanelWrapper} ${filtersOpen ? styles.open : ''}`}>
        <FilterPanel onFilterChange={handleFilterChange} filters={filters} />
      </div>

      <div className={styles.adPlaceholder}>Sponsored learning spotlight – future ad placement</div>

      {loading ? (
        <div className={styles.loading}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className={styles.noCourses}>No courses found</div>
      ) : (
        <div className={styles.courseGrid}>
          {courses.map((course) => (
            <div key={course._id} className={styles.courseCard}>
              {isAdmin && (
                <div className={styles.courseActions}>
                  <button type="button" onClick={() => openCourseModal(course)} className={styles.actionBtn}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCourseDelete(course)}
                    className={`${styles.actionBtn} ${styles.delete}`}
                  >
                    Delete
                  </button>
                </div>
              )}
              <Link to={`/courses/${course._id}`} className={styles.courseLink}>
                <div className={styles.thumbnail}>
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className={styles.placeholder}>No Image</div>
                  )}
                </div>
                <div className={styles.content}>
                  <h3>{course.title}</h3>
                  <p className={styles.instructor}>By {course.instructor}</p>
                  <p className={styles.description}>
                    {(course.description || 'No description available').substring(0, 120)}...
                  </p>
                  <div className={styles.meta}>
                    <span className={styles.level}>{course.level}</span>
                    <span className={styles.rating}>
                      ★ {typeof course.rating === 'number' ? course.rating.toFixed(1) : 'New'}
                    </span>
                    <span className={styles.price}>{course.isFree ? 'Free' : `₹${course.price}`}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {isAdmin && showCourseModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeCourseModal()}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
              <button className={styles.closeModal} onClick={closeCourseModal} type="button">
                ×
              </button>
            </div>
            <form onSubmit={handleCourseSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => handleCourseChange('title', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Instructor</label>
                  <input
                    type="text"
                    value={courseForm.instructor}
                    onChange={(e) => handleCourseChange('instructor', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) => handleCourseChange('category', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Level</label>
                  <select value={courseForm.level} onChange={(e) => handleCourseChange('level', e.target.value)}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows={4}
                  value={courseForm.description}
                  onChange={(e) => handleCourseChange('description', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseForm.price}
                    onChange={(e) => handleCourseChange('price', e.target.value)}
                    disabled={courseForm.isFree}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={courseForm.duration}
                    onChange={(e) => handleCourseChange('duration', e.target.value)}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.switchGroup}`}>
                  <label className={styles.switchLabel}>Free Course</label>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={courseForm.isFree}
                      onChange={(e) => handleCourseChange('isFree', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Thumbnail URL</label>
                <input
                  type="url"
                  value={courseForm.thumbnail}
                  onChange={(e) => handleCourseChange('thumbnail', e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeCourseModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={savingCourse}>
                  {savingCourse ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}

