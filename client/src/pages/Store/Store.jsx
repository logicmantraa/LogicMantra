import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { storeAPI } from '../../utils/api'
import PageShell from '../../components/Layout/PageShell'
import SearchBar from '../../components/SearchBar/SearchBar'
import styles from './Store.module.css'

const initialItemForm = {
  name: '',
  description: '',
  price: 0,
  fileUrl: '',
  category: '',
  type: 'other',
  thumbnail: ''
}

export default function Store() {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.isAdmin)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemForm, setItemForm] = useState(initialItemForm)
  const [editingItem, setEditingItem] = useState(null)
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    loadItems()
  }, [searchTerm])

  const loadItems = async () => {
    setLoading(true)
    try {
      const params = searchTerm ? { search: searchTerm } : {}
      const data = await storeAPI.getStoreItems(params)
      setItems(data)
    } catch (err) {
      console.error('Failed to load store items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (itemId) => {
    if (!window.confirm('Purchase this item? (Payment integration coming soon)')) {
      return
    }

    try {
      await storeAPI.purchaseItem(itemId)
      alert('Purchase successful! (Payment integration coming soon)')
    } catch (err) {
      alert(err.message || 'Failed to purchase')
    }
  }

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        fileUrl: item.fileUrl || '',
        category: item.category || '',
        type: item.type || 'other',
        thumbnail: item.thumbnail || ''
      })
    } else {
      setEditingItem(null)
      setItemForm(initialItemForm)
    }
    setShowItemModal(true)
  }

  const closeItemModal = () => {
    setShowItemModal(false)
    setEditingItem(null)
    setItemForm(initialItemForm)
  }

  const handleItemChange = (field, value) => {
    setItemForm((prev) => ({
      ...prev,
      [field]: field === 'price' ? Number(value) : value
    }))
  }

  const handleItemSubmit = async (event) => {
    event.preventDefault()
    setSavingItem(true)
    try {
      if (editingItem) {
        await storeAPI.updateStoreItem(editingItem._id, itemForm)
      } else {
        await storeAPI.createStoreItem(itemForm)
      }
      await loadItems()
      closeItemModal()
    } catch (err) {
      alert(err.message || 'Failed to save item')
    } finally {
      setSavingItem(false)
    }
  }

  const handleItemDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from the store?`)) return
    try {
      await storeAPI.deleteStoreItem(item._id)
      await loadItems()
    } catch (err) {
      alert(err.message || 'Failed to delete item')
    }
  }

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.kicker}>Premium Resources</p>
          <h1 className={styles.title}>Upgrade Your Learning Toolkit</h1>
          <p className={styles.subtitle}>
            Discover curated notes, practice sheets, and premium resources crafted to complement your courses.
          </p>
        </div>
        {isAdmin && (
          <button className={styles.addItemBtn} onClick={() => openItemModal()} type="button">
            + Add Store Item
          </button>
        )}
      </div>

      <SearchBar
        onSearch={setSearchTerm}
        placeholder="Search resources, categories, or content type..."
        className={styles.search}
      />

      {/* Promote premium bundles here — reserved ad space for future monetisation - Commented out for v1 */}
      {/* <div className={styles.adPlaceholder}>Promote premium bundles here — reserved ad space for future monetisation.</div> */}

      {loading ? (
        <div className={styles.loading}>Loading resources...</div>
      ) : items.length === 0 ? (
        <div className={styles.noItems}>Nothing to show yet. Check back soon!</div>
      ) : (
        <div className={styles.itemsGrid}>
          {items.map((item) => (
            <div key={item._id} className={styles.itemCard}>
              {isAdmin && (
                <div className={styles.itemActions}>
                  <button onClick={() => openItemModal(item)} className={styles.actionBtn} type="button">
                    Edit
                  </button>
                  <button
                    onClick={() => handleItemDelete(item)}
                    className={`${styles.actionBtn} ${styles.delete}`}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )}
              <div className={styles.thumbnail}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} />
                ) : (
                  <div className={styles.placeholder}>Resource</div>
                )}
              </div>
              <div className={styles.content}>
                <h3>{item.name}</h3>
                <p className={styles.description}>{item.description || 'No description provided.'}</p>
                <div className={styles.meta}>
                  <span className={styles.category}>{item.category || 'General'}</span>
                  <span className={styles.type}>{item.type || 'Resource'}</span>
                </div>
                <div className={styles.footer}>
                  <span className={styles.price}>₹{item.price}</span>
                  <button onClick={() => handlePurchase(item._id)} className={styles.purchaseBtn} type="button">
                    Purchase
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && showItemModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeItemModal()}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingItem ? 'Edit Store Item' : 'Create Store Item'}</h2>
              <button className={styles.closeModal} onClick={closeItemModal} type="button">
                ×
              </button>
            </div>
            <form onSubmit={handleItemSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => handleItemChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <input
                    type="text"
                    value={itemForm.category}
                    onChange={(e) => handleItemChange('category', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select value={itemForm.type} onChange={(e) => handleItemChange('type', e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="bundle">Bundle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => handleItemChange('price', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows={4}
                  value={itemForm.description}
                  onChange={(e) => handleItemChange('description', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>File URL</label>
                <input
                  type="url"
                  value={itemForm.fileUrl}
                  onChange={(e) => handleItemChange('fileUrl', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Thumbnail URL (optional)</label>
                <input
                  type="url"
                  value={itemForm.thumbnail}
                  onChange={(e) => handleItemChange('thumbnail', e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeItemModal} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={savingItem}>
                  {savingItem ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}

