import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../../utils/api';
import PageShell from '../../../components/Layout/PageShell';
import AdminRoute from '../../../components/AdminRoute/AdminRoute';
import styles from './AdminProducts.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    productType: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
    isFree: true,
    category: '',
    productType: 'course',
    level: 'beginner',
    thumbnail: ''
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getProducts(filters);
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, formData);
      } else {
        await productAPI.createProduct(formData);
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        title: '',
        description: '',
        instructor: '',
        price: 0,
        isFree: true,
        category: '',
        productType: 'course',
        level: 'beginner',
        thumbnail: ''
      });
      loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      instructor: product.instructor || '',
      price: product.price || 0,
      isFree: product.isFree || false,
      category: product.category || '',
      productType: product.productType || 'course',
      level: product.level || 'beginner',
      thumbnail: product.thumbnail || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productAPI.deleteProduct(productId);
      loadProducts();
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      productType: '',
      search: ''
    });
  };

  if (loading) {
    return (
      <AdminRoute>
        <PageShell contentClassName={styles.container}>
          <div className={styles.loading}>Loading products...</div>
        </PageShell>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Products Control</p>
            <h1>Manage Products</h1>
          </div>
          <button onClick={() => setShowForm(true)} className={styles.addBtn} type="button">
            Add New Product
          </button>
        </div>

        <div className={styles.filters}>
          <h3>Filters</h3>
          <div className={styles.filterRow}>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
            </select>
            <select
              value={filters.productType}
              onChange={(e) => handleFilterChange('productType', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Types</option>
              <option value="course">Course</option>
              <option value="ebook">E-book</option>
              <option value="bundle">Bundle</option>
              <option value="workshop">Workshop</option>
            </select>
            <button onClick={clearFilters} className={styles.clearBtn}>
              Clear
            </button>
          </div>
        </div>

        {showForm && (
          <div className={styles.formModal}>
            <div className={styles.formContent}>
              <h2>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
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
                    <label>Product Type</label>
                    <select
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    >
                      <option value="course">Course</option>
                      <option value="ebook">E-book</option>
                      <option value="bundle">Bundle</option>
                      <option value="workshop">Workshop</option>
                      <option value="certification">Certification</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      disabled={formData.isFree}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.switchLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isFree}
                        onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                      />
                      Free Product
                    </label>
                  </div>
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
                      setShowForm(false);
                      setEditingProduct(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.productsList}>
          {products.length === 0 ? (
            <div className={styles.empty}>
              <h3>No products found</h3>
              <p>Create your first product to get started</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product._id} className={styles.productItem}>
                <div className={styles.productInfo}>
                  <h3>{product.title}</h3>
                  <p>{product.description?.substring(0, 120)}...</p>
                  <div className={styles.meta}>
                    <span>By {product.instructor}</span>
                    <span>{product.category}</span>
                    <span>{product.productType}</span>
                    <span>{product.level}</span>
                    <span>{product.isFree ? 'Free' : `₹${product.price}`}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Link to={`/admin/lectures/${product._id}`} className={styles.manageBtn}>
                    Manage Lectures
                  </Link>
                  <Link to={`/admin/resources/${product._id}`} className={styles.manageBtn}>
                    Manage Resources
                  </Link>
                  <button onClick={() => handleEdit(product)} className={styles.editBtn} type="button">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product._id)} className={styles.deleteBtn} type="button">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PageShell>
    </AdminRoute>
  );
}
