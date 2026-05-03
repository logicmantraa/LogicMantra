import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
    closeMenus();
  };

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMenus = () => {
    setMobileOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} onClick={closeMenus}>
          <span className={styles.logoMark}>
            <img src="/Logo.png" alt="Logic Mantraa" loading="lazy" />
          </span>
          <span className={styles.logoText}>Logic Mantraa</span>
        </Link>

        <div className={styles.navActions}>
          {user ? (
            <div className={styles.userProfile}>
              <span className={styles.userName}>{user.name}</span>
            </div>
          ) : (
            <Link to="/login" className={styles.loginLink}>Login</Link>
          )}

          <button
            className={`${styles.menuToggle} ${mobileOpen ? styles.active : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            type="button"
          >
            <div className={styles.hamburger}>
              <span />
              <span />
              <span />
            </div>
            <span className={styles.menuLabel}>Menu</span>
          </button>
        </div>

        <div
          className={`${styles.navlinks} ${mobileOpen ? styles.open : ""}`}
          role="navigation"
        >
          <div className={styles.menuHeader}>
            <h3>Navigation</h3>
          </div>
          
          <div className={styles.menuGrid}>
            <div className={styles.menuSection}>
              <h4>Explore</h4>
              <Link to="/courses" onClick={closeMenus}>
                Courses
              </Link>
              <Link to="/about" onClick={closeMenus}>
                About
              </Link>
            </div>

            {user && (
              <div className={styles.menuSection}>
                <h4>Account</h4>
                <Link to="/my-courses" onClick={closeMenus}>
                  My Courses
                </Link>
                <Link to="/profile" onClick={closeMenus}>
                  Profile
                </Link>
              </div>
            )}

            {user?.isAdmin && (
              <div className={styles.menuSection}>
                <h4>Administration</h4>
                <Link to="/admin/dashboard" onClick={closeMenus}>
                  Dashboard
                </Link>
                <Link to="/admin/users" onClick={closeMenus}>
                  Users
                </Link>
                <Link to="/admin/contacts" onClick={closeMenus}>
                  Contacts
                </Link>
              </div>
            )}
          </div>

          <div className={styles.menuFooter}>
            {user ? (
              <button onClick={handleLogout} className={styles.logoutBtn} type="button">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={closeMenus} className={styles.footerLogin}>
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && <div className={styles.mobileOverlay} onClick={closeMenus} />}
    </nav>
  );
}
