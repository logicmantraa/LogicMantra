import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { storeAPI, cartAPI, paymentAPI } from '../../utils/api'
import { handleRazorpayPayment } from '../../utils/payment'
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
  const navigate = useNavigate()
  const isAdmin = Boolean(user?.isAdmin)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemForm, setItemForm] = useState(initialItemForm)
  const [editingItem, setEditingItem] = useState(null)
  const [savingItem, setSavingItem] = useState(false)
  const [processingItem, setProcessingItem] = useState(null)

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

  const handleAddToCart = async (itemId) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      await cartAPI.addItem('storeItem', itemId)
      alert('Item added to cart!')
      // Optionally reload items to show updated state
    } catch (err) {
      alert(err.message || 'Failed to add item to cart')
    }
  }

  const handleBuyNow = async (item) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (item.isOwned) {
      alert('You already own this item!')
      return
    }

    setProcessingItem(item._id)

    try {
      // Create direct order
      const orderData = await paymentAPI.createDirectOrder('storeItem', item._id)

      // If free item, redirect to success
      if (orderData.isFree) {
        navigate('/payment/success', {
          state: { order: orderData.order, isFree: true }
        })
        return
      }

      // Handle Razorpay payment
      const result = await handleRazorpayPayment(orderData)

      if (result.success) {
        navigate('/payment/success', {
          state: { order: result.verification.order, verification: result.verification }
        })
      }
    } catch (err) {
      console.error('Purchase error:', err)
      if (err.message !== 'Payment cancelled by user') {
        navigate('/payment/failure', {
          state: { error: err.message || 'Payment failed' }
        })
      }
    } finally {
      setProcessingItem(null)
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
                  {item.isOwned ? (
                    <div className={styles.ownedBadge}>Already Owned</div>
                  ) : (
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleAddToCart(item._id)}
                        className={styles.addToCartBtn}
                        type="button"
                        disabled={processingItem === item._id}
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleBuyNow(item)}
                        className={styles.buyNowBtn}
                        type="button"
                        disabled={processingItem === item._id}
                      >
                        {processingItem === item._id ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  )}
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

