import { useState, useEffect } from 'react'
import { resourceAPI, lectureAPI } from '../../../utils/api'
import PageShell from '../../../components/Layout/PageShell'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminResources.module.css'

export default function AdminResources() {
  const [courses, setCourses] = useState([])
  const [lectures, setLectures] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedLecture, setSelectedLecture] = useState('')
  const [resources, setResources] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'pdf',
    fileUrl: ''
  })

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadLectures(selectedCourse)
      loadResources(selectedCourse, selectedLecture)
    }
  }, [selectedCourse, selectedLecture])

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
      const lectureData = await lectureAPI.getLectures(courseId)
      setLectures(lectureData)
      if (lectureData.length > 0) {
        setSelectedLecture(lectureData[0]._id)
      }
    } catch (err) {
      console.error('Failed to load lectures:', err)
    }
  }

  const loadResources = async (courseId, lectureId) => {
    try {
      const data = await resourceAPI.getResources({ courseId, lectureId })
      setResources(data)
    } catch (err) {
      console.error('Failed to load resources:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingResource) {
        await resourceAPI.updateResource(editingResource._id, { ...formData, courseId: selectedCourse, lectureId: selectedLecture })
      } else {
        await resourceAPI.createResource({ ...formData, courseId: selectedCourse, lectureId: selectedLecture })
      }
      setShowForm(false)
      setEditingResource(null)
      setFormData({ name: '', description: '', type: 'pdf', fileUrl: '' })
      loadResources(selectedCourse, selectedLecture)
    } catch (err) {
      alert(err.message || 'Failed to save resource')
    }
  }

  const handleEdit = (resource) => {
    setEditingResource(resource)
    setFormData({
      name: resource.name,
      description: resource.description,
      type: resource.type,
      fileUrl: resource.fileUrl
    })
    setShowForm(true)
  }

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return
    try {
      await resourceAPI.deleteResource(resourceId)
      loadResources(selectedCourse, selectedLecture)
    } catch (err) {
      alert(err.message || 'Failed to delete resource')
    }
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Manage Resources</h1>
            <p className={styles.subtitle}>Upload notes, practice sheets, and supplementary content for each lecture.</p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(true)} type="button">
            Add Resource
          </button>
        </div>

        {/* Showcase premium resource bundles or sponsor messages here - Commented out for v1 */}
        {/* <div className={styles.adPlaceholder}>Showcase premium resource bundles or sponsor messages here.</div> */}

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Lecture</label>
            <select value={selectedLecture} onChange={(e) => setSelectedLecture(e.target.value)}>
              {lectures.map((lecture) => (
                <option key={lecture._id} value={lecture._id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showForm && (
          <div className={styles.formModal}>
            <div className={styles.formContent}>
              <h2>{editingResource ? 'Edit Resource' : 'New Resource'}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label>Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    <option value="pdf">PDF</option>
                    <option value="sheet">Practice Sheet</option>
                    <option value="link">External Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>File URL</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    required
                  />
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

        <div className={styles.resourcesList}>
          {resources.map((resource) => (
            <div key={resource._id} className={styles.resourceItem}>
              <div className={styles.resourceInfo}>
                <h3>{resource.name}</h3>
                <p>{resource.description || 'No description provided.'}</p>
                <div className={styles.meta}>
                  <span className={styles.type}>{resource.type}</span>
                  <span className={styles.metaDetail}>Linked lecture: {resource.lectureId?.title || '—'}</span>
                </div>
              </div>
              <div className={styles.actions}>
                <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                  View
                </a>
                <button onClick={() => handleEdit(resource)} className={styles.editBtn} type="button">
                  Edit
                </button>
                <button onClick={() => handleDelete(resource._id)} className={styles.deleteBtn} type="button">
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

