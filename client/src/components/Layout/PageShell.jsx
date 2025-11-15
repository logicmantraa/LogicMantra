import Navbar from '../Navbar/Navbar';
import GoogleAd from '../GoogleAd/GoogleAd';
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
            <GoogleAd 
              slot="default"
              format="auto"
              className={styles.sidebarAd}
            />
          </aside>
        )}
        <main className={mainClass}>{children}</main>
        {!hideAds && (
          <aside className={`${styles.adRail} ${styles.right}`}>
            <GoogleAd 
              slot="default"
              format="auto"
              className={styles.sidebarAd}
            />
          </aside>
        )}
      </div>
    </>
  );
}
