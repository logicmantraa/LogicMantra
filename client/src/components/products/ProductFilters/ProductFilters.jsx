import { useState } from 'react';
import styles from './ProductFilters.module.css';

export default function ProductFilters({ filters, onFiltersChange, onClear }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange(key, value);
  };

  const handleClear = () => {
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all' && value !== undefined
  );

  return (
    <div className={`${styles.filters} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.header}>
        <h3>Filters</h3>
        <div className={styles.headerActions}>
          {hasActiveFilters && (
            <button 
              onClick={handleClear}
              className={styles.clearBtn}
              type="button"
            >
              Clear
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleBtn}
            type="button"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      <div className={styles.filterContent}>
        <div className={styles.filterGroup}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="data-science">Data Science</option>
            <option value="web-development">Web Development</option>
            <option value="mobile-development">Mobile Development</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Product Type</label>
          <select
            value={filters.productType || ''}
            onChange={(e) => handleFilterChange('productType', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="course">Course</option>
            <option value="ebook">E-book</option>
            <option value="bundle">Bundle</option>
            <option value="workshop">Workshop</option>
            <option value="certification">Certification</option>
            <option value="template">Template</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Price Range</label>
          <select
            value={filters.priceRange || ''}
            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Prices</option>
            <option value="free">Free Only</option>
            <option value="under-1000">Under ₹1000</option>
            <option value="1000-5000">₹1000 - ₹5000</option>
            <option value="5000-10000">₹5000 - ₹10000</option>
            <option value="over-10000">Over ₹10000</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Difficulty Level</label>
          <select
            value={filters.level || ''}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Rating</label>
          <select
            value={filters.rating || ''}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>

        <div className={styles.customPriceRange}>
          <label>Custom Price Range</label>
          <div className={styles.priceInputs}>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className={styles.priceInput}
              min="0"
            />
            <span className={styles.priceSeparator}>-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className={styles.priceInput}
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
