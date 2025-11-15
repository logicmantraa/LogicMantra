import { Routes, Route } from "react-router-dom";
import SignupForm from "./components/SignupForm/SignupForm";
import LoginForm from "./components/LoginForm/LoginForm";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Courses from "./pages/Courses/Courses";
import CourseDetail from "./pages/CourseDetail/CourseDetail";
import LectureViewer from "./pages/LectureViewer/LectureViewer";
import Profile from "./pages/Profile/Profile";
import MyCourses from "./pages/MyCourses/MyCourses";
import Store from "./pages/Store/Store";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import AdminCourses from "./pages/Admin/Courses/AdminCourses";
import AdminLectures from "./pages/Admin/Lectures/AdminLectures";
import AdminResources from "./pages/Admin/Resources/AdminResources";
import AdminStoreItems from "./pages/Admin/StoreItems/AdminStoreItems";
import AdminUsers from "./pages/Admin/Users/AdminUsers";
import AdminContacts from "./pages/Admin/Contacts/AdminContacts";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AdminRoute from "./components/AdminRoute/AdminRoute";
import GuestRoute from "./components/GuestRoute/GuestRoute";

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
        <Route path="/courses" element={<Courses />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/lectures/:lectureId"
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
          path="/my-courses"
          element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store"
          element={
            <ProtectedRoute>
              <Store />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <AdminRoute>
              <AdminCourses />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/lectures/:courseId"
          element={
            <AdminRoute>
              <AdminLectures />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/resources/:courseId"
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
