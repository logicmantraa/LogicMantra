import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../utils/api';
import PageShell from '../../components/Layout/PageShell';
import styles from './Products.module.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    productType: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productAPI.getProducts(filters);
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      productType: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
  };

  if (loading) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.loading}>Loading products...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.error}>
          <h3>Error loading products</h3>
          <p>{error}</p>
          <button onClick={loadProducts} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Products</h1>
          <p>Discover our collection of courses and learning resources</p>
        </div>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.filters}>
            <h3>Filters</h3>
            
            <div className={styles.filterGroup}>
              <label>Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Category</label>
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
            </div>

            <div className={styles.filterGroup}>
              <label>Product Type</label>
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
            </div>

            <div className={styles.filterGroup}>
              <label>Price Range</label>
              <div className={styles.priceRange}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className={styles.filterInput}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            </div>

            <button onClick={clearFilters} className={styles.clearBtn}>
              Clear Filters
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          {products.length === 0 ? (
            <div className={styles.empty}>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <div key={product._id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} />
                    ) : (
                      <div className={styles.placeholderImage}>
                        📚
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.productContent}>
                    <span className={styles.productType}>
                      {product.productType || 'Course'}
                    </span>
                    <h3 className={styles.productTitle}>
                      <Link to={`/products/${product._id}`}>
                        {product.title}
                      </Link>
                    </h3>
                    <p className={styles.productDescription}>
                      {product.description?.substring(0, 150)}...
                    </p>
                    
                    <div className={styles.productMeta}>
                      <span className={styles.category}>{product.category}</span>
                      <span className={styles.rating}>
                        ⭐ {product.rating?.toFixed(1) || 'New'}
                      </span>
                    </div>
                    
                    <div className={styles.productFooter}>
                      <span className={styles.price}>
                        {product.isFree ? 'Free' : `₹${product.price}`}
                      </span>
                      <Link 
                        to={`/products/${product._id}`}
                        className={styles.viewBtn}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </PageShell>
  );
}
