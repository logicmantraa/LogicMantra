import { useMemo, useState, useEffect } from 'react'
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

  const courseCategories = useMemo(() => {
    const unique = new Set()
    courses.forEach((course) => {
      if (course.category) {
        unique.add(course.category)
      }
    })
    return Array.from(unique)
  }, [courses])

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

  const handleCategoryClick = (category) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? '' : category
    }))
    setFiltersOpen(false)
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

  const toggleFilters = () => {
    setFiltersOpen((prev) => !prev)
  }

  const courseStats = [
    { label: 'Courses', value: courses.length || 0 },
    { label: 'Free Tracks', value: courses.filter((course) => course.isFree).length },
    { label: 'Mentors', value: new Set(courses.map((course) => course.instructor)).size },
    { label: 'Average Rating', value: courses.length ? `${(courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length).toFixed(1)}★` : '—' }
  ]

  return (
    <PageShell contentClassName={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroPill}>Curated Learning Tracks</span>
          <h1>Discover Courses Crafted For Impact</h1>
          <p>
            Browse learning journeys designed to help you master in-demand skills with hands-on projects, expert mentors,
            and resources tailored to your goals.
          </p>
        </div>
        <div className={styles.heroStats}>
          {courseStats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.searchRow}>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by course name, instructor, or keyword..."
            className={styles.searchBar}
          />
          <div className={styles.actionGroup}>
            <button className={styles.filterButton} onClick={toggleFilters} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6H20M6 12H18M10 18H14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Filters
            </button>
            {isAdmin && (
              <button className={styles.addCourseBtn} onClick={() => openCourseModal()} type="button">
                + New Course
              </button>
            )}
          </div>
        </div>

        {courseCategories.length > 0 && (
          <div className={styles.categoryScroller}>
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`${styles.categoryChip} ${!filters.category ? styles.active : ''}`}
            >
              All Tracks
            </button>
            {courseCategories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`${styles.categoryChip} ${filters.category === category ? styles.active : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className={styles.resultsArea}>
        <div className={styles.resultsTopBar}>
          <p className={styles.resultsSummary}>
            {loading ? 'Refreshing catalogue…' : `Showing ${courses.length} curated ${courses.length === 1 ? 'course' : 'courses'}`}
          </p>
          <div className={styles.adPlaceholder}>Reserved space for spotlight announcements & future promotions</div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className={styles.noCourses}>
            <h3>No courses match your filters yet</h3>
            <p>Try adjusting your filters or exploring a different category.</p>
          </div>
        ) : (
          <div className={styles.courseGrid}>
            {courses.map((course) => (
              <article key={course._id} className={styles.courseCard}>
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
                      <div className={styles.placeholder}>LM</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.levelBadge}>{course.level}</span>
                      <span className={styles.duration}>{course.duration ? `${course.duration} min` : 'Self-paced'}</span>
                    </div>
                    <h3>{course.title}</h3>
                    <p className={styles.description}>
                      {(course.description || 'No description available').substring(0, 140)}...
                    </p>
                    <div className={styles.cardFooter}>
                      <div className={styles.instructorBlock}>
                        <span className={styles.label}>Instructor</span>
                        <span className={styles.value}>{course.instructor}</span>
                      </div>
                      <div className={styles.pricingBlock}>
                        <span className={styles.value}>{course.isFree ? 'Free' : `₹${course.price}`}</span>
                        <span className={styles.rating}>
                          ★ {typeof course.rating === 'number' ? course.rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className={styles.filterSheet}>
          <div className={styles.filterHeader}>
            <span>Refine Results</span>
            <button onClick={toggleFilters} type="button" aria-label="Close filters">
              ✕
            </button>
          </div>
          <FilterPanel onFilterChange={handleFilterChange} filters={filters} />
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

      {filtersOpen && <div className={styles.filterOverlay} onClick={toggleFilters} />}
    </PageShell>
  )
}

