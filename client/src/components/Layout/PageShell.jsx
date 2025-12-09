import Navbar from '../Navbar/Navbar';
import styles from './PageShell.module.css';

// Ads disabled for v1: layout simplified to a single content column.
export default function PageShell({ children, contentClassName = '' }) {
  const frameClass = `${styles.frame} ${styles.frameCompact}`;
  const mainClass = contentClassName
    ? `${styles.content} ${contentClassName}`
    : styles.content;

  return (
    <>
      <Navbar />
      <div className={frameClass}>
        <main className={mainClass}>{children}</main>
      </div>
    </>
  );
}
