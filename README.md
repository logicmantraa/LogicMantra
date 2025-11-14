# Logic Mantraa - EdTech Learning Platform

A comprehensive MERN stack-based educational technology platform that provides an interactive learning experience for students and powerful management tools for administrators.

![Logic Mantraa](client/public/Logo.png)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [User Roles](#user-roles)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Logic Mantraa is a full-stack web application designed to deliver online courses, lectures, and educational resources. The platform supports two types of users:

- **Students**: Browse courses, enroll in programs, watch lectures, access resources, and track their learning progress
- **Administrators**: Manage courses, lectures, resources, users, and store items through an intuitive dashboard

## ✨ Features

### Student Features

#### Basic Features
- ✅ User registration and authentication
- ✅ Profile management (name, email, phone number)
- ✅ Password update functionality
- ✅ Secure login/logout

#### Primary Features
- 🔍 **Course Discovery**
  - Search courses by name, instructor, or keyword
  - Filter courses by category, level, rating, and price
  - View detailed course information

- 📚 **Learning Experience**
  - Enroll in free and paid courses
  - Watch video lectures (YouTube integration)
  - Access downloadable resources (notes, practice sheets)
  - Track course completion progress
  - Mark lectures as complete

- ⭐ **Engagement**
  - Rate courses (1-5 stars)
  - Provide text feedback/reviews
  - View ratings and reviews from other students

- 🛒 **Store**
  - Browse additional educational resources
  - Purchase supplementary materials

- 📊 **Progress Tracking**
  - View enrolled courses in "My Courses"
  - Track completion percentage
  - See recommended courses

### Admin Features

- 📊 **Analytics Dashboard**
  - View platform statistics
  - Monitor user engagement
  - Track course performance

- 🎓 **Content Management**
  - Create, update, and delete courses
  - Add lectures to courses (YouTube links)
  - Upload and manage resources (PDFs, notes, practice sheets)
  - Set course pricing and categories

- 👥 **User Management**
  - View all registered users
  - Access user details
  - Manage user accounts

- 🛍️ **Store Management**
  - Add, update, and delete store items
  - Manage pricing and availability

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - UI library
- **React Router DOM 6.28.0** - Client-side routing
- **Vite 7.1.7** - Build tool and dev server
- **CSS Modules** - Component-scoped styling

### Backend
- **Node.js** - Runtime environment
- **Express.js 5.1.0** - Web framework
- **MongoDB** - Database
- **Mongoose 8.19.2** - ODM for MongoDB
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **bcryptjs 3.0.2** - Password hashing
- **Multer 2.0.2** - File upload handling
- **CORS 2.8.5** - Cross-origin resource sharing

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LogicMantra
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Create a `.env` file in the `server` directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/logicmantraa
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Logic Mantraa
FRONTEND_URL=http://localhost:5173
```

2. Update `MONGO_URI` with your MongoDB connection string:
   - For local MongoDB: `mongodb://localhost:27017/logicmantraa`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/logicmantraa`

3. Generate a secure `JWT_SECRET` (you can use any random string)

### Frontend Configuration

1. Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

2. Update `VITE_API_URL` if your backend runs on a different port or domain

## 🏃 Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000`

#### Start the Frontend Development Server

```bash
cd client
npm run dev
```

The client will run on `http://localhost:5173` (or the next available port)

### Production Mode

#### Build the Frontend

```bash
cd client
npm run build
```

#### Start the Backend (Production)

```bash
cd server
npm start
```

## 📁 Project Structure

```
LogicMantra/
├── client/                 # React frontend application
│   ├── public/             # Static assets
│   │   └── Logo.png        # Application logo
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── AdminRoute/
│   │   │   ├── FilterPanel/
│   │   │   ├── Layout/
│   │   │   ├── LoginForm/
│   │   │   ├── Navbar/
│   │   │   ├── ProtectedRoute/
│   │   │   ├── Rating/
│   │   │   ├── SearchBar/
│   │   │   └── SignupForm/
│   │   ├── context/        # React Context providers
│   │   │   └── AuthContext.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── About/
│   │   │   ├── Admin/      # Admin pages
│   │   │   ├── CourseDetail/
│   │   │   ├── Courses/
│   │   │   ├── Home/
│   │   │   ├── LectureViewer/
│   │   │   ├── MyCourses/
│   │   │   ├── Profile/
│   │   │   └── Store/
│   │   ├── utils/          # Utility functions
│   │   │   └── api.js      # API request helpers
│   │   ├── App.jsx         # Main App component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json
│   └── vite.config.js
│
└── server/                 # Node.js backend application
    ├── src/
    │   ├── config/         # Configuration files
    │   │   ├── db.js       # Database connection
    │   │   └── upload.js   # File upload config
    │   ├── controllers/    # Route controllers
    │   │   ├── adminController.js
    │   │   ├── authController.js
    │   │   ├── courseController.js
    │   │   ├── enrollmentController.js
    │   │   ├── lectureController.js
    │   │   ├── ratingController.js
    │   │   ├── resourceController.js
    │   │   ├── storeController.js
    │   │   └── userController.js
    │   ├── middleware/     # Express middleware
    │   │   ├── authMiddleware.js
    │   │   └── errorHandler.js
    │   ├── models/         # Mongoose models
    │   │   ├── Course.js
    │   │   ├── Enrollment.js
    │   │   ├── Lecture.js
    │   │   ├── Rating.js
    │   │   ├── Resource.js
    │   │   ├── StoreItem.js
    │   │   └── User.js
    │   ├── routes/         # API routes
    │   │   ├── admin.js
    │   │   ├── auth.js
    │   │   ├── course.js
    │   │   ├── enrollment.js
    │   │   ├── lecture.js
    │   │   ├── rating.js
    │   │   ├── resource.js
    │   │   ├── store.js
    │   │   └── user.js
    │   ├── utils/          # Utility functions
    │   │   └── generateToken.js
    │   └── server.js       # Server entry point
    ├── package.json
    └── .env               # Environment variables (create this)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/update-password` - Update password

### Courses
- `GET /api/courses` - Get all courses (with search and filters)
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Lectures
- `GET /api/lectures/course/:courseId` - Get lectures for a course
- `GET /api/lectures/:id` - Get lecture by ID
- `POST /api/lectures` - Create lecture (Admin only)
- `PUT /api/lectures/:id` - Update lecture (Admin only)
- `DELETE /api/lectures/:id` - Delete lecture (Admin only)

### Resources
- `GET /api/resources/course/:courseId` - Get resources for a course
- `GET /api/resources/lecture/:lectureId` - Get resources for a lecture
- `GET /api/resources/:id` - Get resource by ID
- `POST /api/resources` - Create resource (Admin only)
- `PUT /api/resources/:id` - Update resource (Admin only)
- `DELETE /api/resources/:id` - Delete resource (Admin only)

### Enrollments
- `POST /api/enrollments` - Enroll in a course
- `GET /api/enrollments/my-courses` - Get user's enrollments
- `PUT /api/enrollments/:id/progress` - Update enrollment progress
- `GET /api/enrollments/check/:courseId` - Check enrollment status

### Ratings
- `POST /api/ratings` - Submit a rating
- `GET /api/ratings/course/:courseId` - Get ratings for a course

### Store
- `GET /api/store` - Get all store items
- `GET /api/store/:id` - Get store item by ID
- `POST /api/store` - Create store item (Admin only)
- `PUT /api/store/:id` - Update store item (Admin only)
- `DELETE /api/store/:id` - Delete store item (Admin only)

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/users/:id` - Get user by ID (Admin only)

## 👥 User Roles

### Student
- Default role for all registered users
- Can browse, search, and filter courses
- Can enroll in courses
- Can watch lectures and access resources
- Can rate and review courses
- Can manage their profile

### Admin
- Special role with elevated permissions
- Can manage all courses, lectures, and resources
- Can view and manage users
- Can manage store items
- Has access to analytics dashboard
- Can add lectures and resources directly from course pages

**Note**: To create an admin user, you need to manually set `isAdmin: true` in the MongoDB database for the user document.

## 🚧 Future Enhancements

- [ ] Payment gateway integration (Razorpay)
- [ ] Video upload functionality (AWS S3 or similar)
- [ ] Google Ads integration for unsubscribed users
- [ ] Email notifications
- [ ] Certificate generation upon course completion
- [ ] Discussion forums for courses
- [ ] Live classes/sessions
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Dark mode theme

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Logic Mantraa Team**

---

## 📞 Support

For support, email support@logicmantraa.com or create an issue in the repository.

---

**Built with ❤️ using the MERN stack**

