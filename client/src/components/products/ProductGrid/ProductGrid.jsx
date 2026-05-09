import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ 
  products, 
  loading = false, 
  error = null, 
  compact = false,
  columns = 'auto' 
}) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonImage}></div>
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonMeta}></div>
                <div className={styles.skeletonFooter}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error loading products</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3>No products found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      </div>
    );
  }

  const gridStyles = {
    '--grid-columns': columns === 'auto' 
      ? 'repeat(auto-fill, minmax(320px, 1fr))'
      : columns === 2 
      ? 'repeat(2, 1fr)'
      : columns === 3 
      ? 'repeat(3, 1fr)'
      : columns === 4 
      ? 'repeat(4, 1fr)'
      : 'repeat(auto-fill, minmax(320px, 1fr))'
  };

  return (
    <div className={styles.container} style={gridStyles}>
      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductCard 
            key={product._id} 
            product={product} 
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
