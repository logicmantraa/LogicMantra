import { useState, useEffect } from 'react'
import { productAPI } from '../../../utils/api'
import PageShell from '../../../components/Layout/PageShell'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminStoreItems.module.css'

export default function AdminStoreItems() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    productType: '',
    search: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    fileUrl: '',
    category: '',
    productType: 'other',
    thumbnail: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await productAPI.getProducts(filters)
      setProducts(data || [])
    } catch (err) {
      console.error('Failed to load store items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, {
          title: formData.name,
          description: formData.description,
          price: formData.price,
          thumbnail: formData.thumbnail,
          category: formData.category,
          productType: formData.productType
        })
      } else {
        await productAPI.createProduct({
          title: formData.name,
          description: formData.description,
          price: formData.price,
          thumbnail: formData.thumbnail,
          category: formData.category,
          productType: formData.productType,
          isFree: formData.price === 0
        })
      }
      setShowForm(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: 0,
        fileUrl: '',
        category: '',
        productType: 'other',
        thumbnail: ''
      })
      loadProducts()
    } catch (err) {
      alert(err.message || 'Failed to save store item')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.title,
      description: product.description,
      price: product.price || 0,
      fileUrl: product.fileUrl || '',
      category: product.category || '',
      productType: product.productType || 'other',
      thumbnail: product.thumbnail || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await productAPI.deleteProduct(productId)
      loadProducts()
    } catch (err) {
      alert(err.message || 'Failed to delete store item')
    }
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <h1>Manage Store Products</h1>
          <button onClick={() => setShowForm(true)} className={styles.addBtn}>
            + Add New Product
          </button>
        </div>

        {showForm && (
          <div className={styles.formModal} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <div className={styles.formContent}>
              <h2>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
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
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    >
                      <option value="course">Course</option>
                      <option value="ebook">E-book</option>
                      <option value="bundle">Bundle</option>
                      <option value="workshop">Workshop</option>
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
                    setEditingProduct(null)
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
            {products.map((product) => (
              <div key={product._id} className={styles.itemCard}>
                {product.thumbnail && (
                  <div className={styles.thumbnail}>
                    <img src={product.thumbnail} alt={product.title} />
                  </div>
                )}
                <div className={styles.content}>
                  <h3>{product.title}</h3>
                  <p className={styles.description}>{product.description || 'No description'}</p>
                  <div className={styles.meta}>
                    <span className={styles.category}>{product.category}</span>
                    <span className={styles.type}>{product.productType}</span>
                  </div>
                  <div className={styles.footer}>
                    <span className={styles.price}>₹{product.price}</span>
                    <div className={styles.actions}>
                      <button onClick={() => handleEdit(product)} className={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(product._id)} className={styles.deleteBtn}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </AdminRoute>
  )
}

