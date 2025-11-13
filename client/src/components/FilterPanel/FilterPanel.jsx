import { useState } from 'react'
import styles from './FilterPanel.module.css'

export default function FilterPanel({ onFilterChange, filters = {} }) {
  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    level: filters.level || '',
    minRating: filters.minRating || '',
    maxPrice: filters.maxPrice || '',
    isFree: filters.isFree || ''
  })

  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const clearFilters = () => {
    const cleared = {
      category: '',
      level: '',
      minRating: '',
      maxPrice: '',
      isFree: ''
    }
    setLocalFilters(cleared)
    if (onFilterChange) {
      onFilterChange(cleared)
    }
  }

  return (
    <div className={styles.filterPanel}>
      <h3>Filters</h3>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Category</label>
          <input
            type="text"
            placeholder="e.g., Programming, Design"
            value={localFilters.category}
            onChange={(e) => handleChange('category', e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Level</label>
          <select
            value={localFilters.level}
            onChange={(e) => handleChange('level', e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Min Rating</label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="0"
            value={localFilters.minRating}
            onChange={(e) => handleChange('minRating', e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Max Price</label>
          <input
            type="number"
            min="0"
            placeholder="Any"
            value={localFilters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>
            <input
              type="checkbox"
              checked={localFilters.isFree === 'true'}
              onChange={(e) => handleChange('isFree', e.target.checked ? 'true' : '')}
            />
            Free Only
          </label>
        </div>
      </div>
      <button onClick={clearFilters} className={styles.clearBtn}>
        Clear Filters
      </button>
    </div>
  )
}

