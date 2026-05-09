import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from 'react';
import SignupForm from "./components/SignupForm/SignupForm";
import LoginForm from "./components/LoginForm/LoginForm";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import LectureViewer from "./pages/LectureViewer/LectureViewer";
import Profile from "./pages/Profile/Profile";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import AdminLectures from "./pages/Admin/Lectures/AdminLectures";
import AdminResources from "./pages/Admin/Resources/AdminResources";
import AdminStoreItems from "./pages/Admin/StoreItems/AdminStoreItems";
import AdminUsers from "./pages/Admin/Users/AdminUsers";
import AdminContacts from "./pages/Admin/Contacts/AdminContacts";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AdminRoute from "./components/AdminRoute/AdminRoute";
import GuestRoute from "./components/GuestRoute/GuestRoute";
import PageShell from "./components/Layout/PageShell";

// Lazy load product pages
const Products = lazy(() => import('./pages/Products/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail'));
const Store = lazy(() => import('./pages/Store/Store'));
const Library = lazy(() => import('./pages/Library/Library'));

// Lazy load admin pages
const AdminProducts = lazy(() => import('./pages/Admin/Products/AdminProducts'));

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginForm />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignupForm />
            </GuestRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <GuestRoute>
              <VerifyOTP />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />
        
        {/* Product Routes */}
        <Route 
          path="/products" 
          element={
            <Suspense fallback={<PageShell><div>Loading...</div></PageShell>}>
              <Products />
            </Suspense>
          } 
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageShell><div>Loading...</div></PageShell>}>
                <ProductDetail />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:productId/lectures/:lectureId"
          element={
            <ProtectedRoute>
              <LectureViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageShell><div>Loading...</div></PageShell>}>
                <Library />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/store"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageShell><div>Loading...</div></PageShell>}>
                <Store />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Suspense fallback={<PageShell><div>Loading...</div></PageShell>}>
                <AdminProducts />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/lectures/:productId"
          element={
            <AdminRoute>
              <AdminLectures />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/resources/:productId"
          element={
            <AdminRoute>
              <AdminResources />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/store-items"
          element={
            <AdminRoute>
              <AdminStoreItems />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/contacts"
          element={
            <AdminRoute>
              <AdminContacts />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
