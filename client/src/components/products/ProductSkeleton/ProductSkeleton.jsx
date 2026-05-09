import styles from './ProductSkeleton.module.css';

export default function ProductSkeleton({ compact = false, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className={`${styles.skeletonCard} ${compact ? styles.compact : ''}`}
        >
          <div className={styles.skeletonImage}>
            <div className={styles.skeletonBadge}></div>
            <div className={styles.skeletonBadge}></div>
          </div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonCategory}></div>
            <div className={styles.skeletonTitle}></div>
            {!compact && <div className={styles.skeletonDescription}></div>}
            <div className={styles.skeletonMeta}></div>
            <div className={styles.skeletonFooter}></div>
          </div>
        </div>
      ))}
    </>
  );
}
