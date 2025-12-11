import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cartAPI } from "../../utils/api";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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

  useEffect(() => {
    if (user) {
      loadCartCount();
      // Refresh cart count every 30 seconds
      const interval = setInterval(loadCartCount, 30000);
      return () => clearInterval(interval);
    } else {
      setCartCount(0);
    }
  }, [user]);

  const loadCartCount = async () => {
    try {
      const cart = await cartAPI.getTotal();
      setCartCount(cart.itemCount || 0);
    } catch (err) {
      // Silently fail - cart might not exist yet
      setCartCount(0);
    }
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
          <div className={styles.mainLinks}>
            <Link to="/courses" onClick={closeMenus}>
              Courses
            </Link>
            {user && (
              <Link to="/my-courses" onClick={closeMenus}>
                My Courses
              </Link>
            )}
            <Link to="/store" onClick={closeMenus}>
              Store
            </Link>
            <Link to="/about" onClick={closeMenus}>
              About
            </Link>
          </div>

          <div className={styles.userLinks}>
            {user ? (
              <>
                <Link to="/cart" onClick={closeMenus} className={styles.cartLink} aria-label="Shopping Cart">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 17.9 19 19 19C20.1 19 21 18.1 21 17V13M9 19.5C9.8 19.5 10.5 20.2 10.5 21C10.5 21.8 9.8 22.5 9 22.5C8.2 22.5 7.5 21.8 7.5 21C7.5 20.2 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21C21.5 21.8 20.8 22.5 20 22.5C19.2 22.5 18.5 21.8 18.5 21C18.5 20.2 19.2 19.5 20 19.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
                </Link>
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
              </>
            ) : (
              <Link to="/login" onClick={closeMenus} className={styles.loginLink}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && <div className={styles.mobileOverlay} onClick={closeMenus} />}
    </nav>
  );
}
