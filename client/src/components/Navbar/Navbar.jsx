import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

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
    if (adminMenuOpen) setAdminMenuOpen(false);
  };

  const toggleAdminMenu = () => {
    setAdminMenuOpen((prev) => !prev);
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setAdminMenuOpen(false);
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

        <button
          className={`${styles.menuToggle} ${mobileOpen ? styles.active : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`${styles.navlinks} ${mobileOpen ? styles.open : ""}`}
          role="navigation"
        >
          <Link to="/courses" onClick={closeMenus}>
            Courses
          </Link>
          <Link to="/my-courses" onClick={closeMenus}>
            My Courses
          </Link>
          <Link to="/store" onClick={closeMenus}>
            Store
          </Link>
          <Link to="/about" onClick={closeMenus}>
            About
          </Link>

          {user ? (
            <>
              <Link to="/profile" onClick={closeMenus}>
                Profile
              </Link>

              {user.isAdmin && (
                <div className={styles.adminMenu}>
                  <button
                    className={`${styles.adminToggle} ${
                      adminMenuOpen ? styles.openToggle : ""
                    }`}
                    onClick={toggleAdminMenu}
                    type="button"
                    aria-expanded={adminMenuOpen}
                  >
                    Manage
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    className={`${styles.adminDropdown} ${
                      adminMenuOpen ? styles.show : ""
                    }`}
                  >
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
                </div>
              )}

              <button onClick={handleLogout} className={styles.logoutBtn} type="button">
                Logout
              </button>
            </>
          ) : (
            <div className={styles.authGroup}>
              <Link to="/login" onClick={closeMenus}>
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && <div className={styles.mobileOverlay} onClick={closeMenus} />}
    </nav>
  );
}
