import Navbar from '../Navbar/Navbar';
import styles from './PageShell.module.css';

export default function PageShell({ children, contentClassName = '', hideAds = false }) {
  const frameClass = hideAds
    ? `${styles.frame} ${styles.frameCompact}`
    : styles.frame;
  const mainClass = contentClassName
    ? `${styles.content} ${contentClassName}`
    : styles.content;

  return (
    <>
      <Navbar />
      <div className={frameClass}>
        {!hideAds && (
          <aside className={`${styles.adRail} ${styles.left}`}> 
            <div className={styles.adPlaceholder}>
              Promotional Space
            </div>
          </aside>
        )}
        <main className={mainClass}>{children}</main>
        {!hideAds && (
          <aside className={`${styles.adRail} ${styles.right}`}>
            <div className={styles.adPlaceholder}>
              Promotional Space
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
