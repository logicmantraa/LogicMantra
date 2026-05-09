import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accessAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import PageShell from '../../components/Layout/PageShell';
import styles from './Library.module.css';

export default function Library() {
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    productType: '',
    category: '',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    loadLibrary();
  }, [filters]);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accessAPI.getMyLibrary(filters);
      setLibrary(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load library');
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      productType: '',
      category: '',
      status: 'all',
      search: ''
    });
  };

  const updateProgress = async (accessId, progressData) => {
    try {
      await accessAPI.updateProgress(accessId, progressData);
      loadLibrary(); // Refresh library data
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const getProgressPercentage = (progress) => {
    if (!progress || typeof progress !== 'object') return 0;
    
    if (progress.completedLectures && progress.totalLectures) {
      return Math.round((progress.completedLectures / progress.totalLectures) * 100);
    }
    
    if (progress.percentage) {
      return progress.percentage;
    }
    
    return 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'not_started': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return 'Not Started';
    }
  };

  if (loading) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.loading}>Loading your library...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.error}>
          <h3>Error loading library</h3>
          <p>{error}</p>
          <button onClick={loadLibrary} className={styles.retryBtn}>
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
          <h1>My Library</h1>
          <p>Your purchased products and learning progress</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{library.length}</span>
            <span className={styles.statLabel}>Products</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {library.filter(item => getProgressPercentage(item.progress) === 100).length}
            </span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.filters}>
            <h3>Filter Library</h3>
            
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
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button onClick={clearFilters} className={styles.clearBtn}>
              Clear Filters
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          {library.length === 0 ? (
            <div className={styles.empty}>
              <h3>Your library is empty</h3>
              <p>Start by exploring our products and adding them to your library</p>
              <Link to="/store" className={styles.browseBtn}>
                Browse Store
              </Link>
            </div>
          ) : (
            <div className={styles.libraryGrid}>
              {library.map((item) => {
                const progressPercentage = getProgressPercentage(item.progress);
                const status = progressPercentage === 100 ? 'completed' : 
                              progressPercentage > 0 ? 'in_progress' : 'not_started';
                
                return (
                  <div key={item._id} className={styles.libraryCard}>
                    <div className={styles.productImage}>
                      {item.productId?.thumbnail ? (
                        <img src={item.productId.thumbnail} alt={item.productId.title} />
                      ) : (
                        <div className={styles.placeholderImage}>
                          📚
                        </div>
                      )}
                      <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(status) }}>
                        {getStatusText(status)}
                      </div>
                    </div>
                    
                    <div className={styles.libraryContent}>
                      <span className={styles.productType}>
                        {item.productId?.productType || 'Course'}
                      </span>
                      <h3 className={styles.productTitle}>
                        <Link to={`/products/${item.productId?._id}`}>
                          {item.productId?.title}
                        </Link>
                      </h3>
                      <p className={styles.productDescription}>
                        {item.productId?.description?.substring(0, 120)}...
                      </p>
                      
                      <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Progress</span>
                          <span className={styles.progressPercentage}>{progressPercentage}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className={styles.progressDetails}>
                          {item.progress?.completedLectures && item.progress?.totalLectures && (
                            <span className={styles.progressText}>
                              {item.progress.completedLectures} of {item.progress.totalLectures} completed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.libraryMeta}>
                        <span className={styles.category}>{item.productId?.category}</span>
                        <span className={styles.addedDate}>
                          Added {new Date(item.addedToLibraryAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className={styles.libraryActions}>
                        <Link 
                          to={`/products/${item.productId?._id}`}
                          className={styles.continueBtn}
                        >
                          {progressPercentage > 0 ? 'Continue Learning' : 'Start Learning'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PageShell>
  );
}
