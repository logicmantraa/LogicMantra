import { useState } from 'react'
import styles from './SearchBar.module.css'

export default function SearchBar({ onSearch, placeholder = 'Search...', className = '' }) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    // Optional: debounce for real-time search
    if (onSearch) {
      onSearch(value)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${styles.searchBar} ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className={styles.input}
      />
      <button type="submit" className={styles.button}>
        Search
      </button>
    </form>
  )
}

