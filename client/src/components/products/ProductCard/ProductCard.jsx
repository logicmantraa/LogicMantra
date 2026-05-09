import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, compact = false }) {
  if (!product) return null;

  const averageRating = typeof product.rating === 'number' ? product.rating.toFixed(1) : 'New';
  const ratingCount = product.totalRatings || 0;

  return (
    <div className={`${styles.productCard} ${compact ? styles.compact : ''}`}>
      <div className={styles.productImage}>
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.title} />
        ) : (
          <div className={styles.placeholderImage}>
            📚
          </div>
        )}
        {product.isFree && (
          <div className={styles.freeBadge}>FREE</div>
        )}
        {product.productType && (
          <div className={styles.typeBadge}>{product.productType}</div>
        )}
      </div>
      
      <div className={styles.productContent}>
        <span className={styles.category}>{product.category}</span>
        <h3 className={styles.productTitle}>
          <Link to={`/products/${product._id}`}>
            {product.title}
          </Link>
        </h3>
        
        {!compact && (
          <p className={styles.productDescription}>
            {product.description?.substring(0, 150)}...
          </p>
        )}
        
        <div className={styles.productMeta}>
          <span className={styles.rating}>
            ⭐ {averageRating}
            <span className={styles.ratingCount}>
              ({ratingCount})
            </span>
          </span>
          <span className={styles.instructor}>
            By {product.instructor || 'Logic Mantraa'}
          </span>
        </div>
        
        <div className={styles.productFooter}>
          <div className={styles.priceInfo}>
            <span className={styles.price}>
              {product.isFree ? 'Free' : `₹${product.price}`}
            </span>
            {!product.isFree && product.originalPrice && (
              <span className={styles.originalPrice}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            <Link 
              to={`/products/${product._id}`}
              className={styles.viewBtn}
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
