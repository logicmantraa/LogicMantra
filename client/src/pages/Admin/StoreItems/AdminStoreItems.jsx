import { useState, useEffect } from 'react'
import { storeAPI } from '../../../utils/api'
import Navbar from '../../../components/Navbar/Navbar'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminStoreItems.module.css'

export default function AdminStoreItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    fileUrl: '',
    category: '',
    type: 'other',
    thumbnail: ''
  })

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const data = await storeAPI.getStoreItems()
      setItems(data)
    } catch (err) {
      console.error('Failed to load store items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await storeAPI.updateStoreItem(editingItem._id, formData)
      } else {
        await storeAPI.createStoreItem(formData)
      }
      setShowForm(false)
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        price: 0,
        fileUrl: '',
        category: '',
        type: 'other',
        thumbnail: ''
      })
      loadItems()
    } catch (err) {
      alert(err.message || 'Failed to save store item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      fileUrl: item.fileUrl,
      category: item.category,
      type: item.type,
      thumbnail: item.thumbnail || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this store item?')) {
      return
    }

    try {
      await storeAPI.deleteStoreItem(itemId)
      loadItems()
    } catch (err) {
      alert(err.message || 'Failed to delete store item')
    }
  }

  return (
    <AdminRoute>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Store Items</h1>
          <button onClick={() => setShowForm(true)} className={styles.addBtn}>
            + Add New Item
          </button>
        </div>

        {showForm && (
          <div className={styles.formModal} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <div className={styles.formContent}>
              <h2>{editingItem ? 'Edit Store Item' : 'New Store Item'}</h2>
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
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
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
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="bundle">Bundle</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>File URL</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    required
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn}>Save</button>
                  <button type="button" onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                  }} className={styles.cancelBtn}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.itemsGrid}>
            {items.map((item) => (
              <div key={item._id} className={styles.itemCard}>
                {item.thumbnail && (
                  <div className={styles.thumbnail}>
                    <img src={item.thumbnail} alt={item.name} />
                  </div>
                )}
                <div className={styles.content}>
                  <h3>{item.name}</h3>
                  <p className={styles.description}>{item.description || 'No description'}</p>
                  <div className={styles.meta}>
                    <span className={styles.category}>{item.category}</span>
                    <span className={styles.type}>{item.type}</span>
                  </div>
                  <div className={styles.footer}>
                    <span className={styles.price}>₹{item.price}</span>
                    <div className={styles.actions}>
                      <button onClick={() => handleEdit(item)} className={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item._id)} className={styles.deleteBtn}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminRoute>
  )
}

