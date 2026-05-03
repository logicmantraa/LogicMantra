# 🛠️ Complete Setup Guide - Logic Mantraa

This guide provides comprehensive instructions for setting up the Logic Mantraa platform, covering database configuration, email services, and environment variables.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Database Configuration](#database-configuration)
- [Email Service Setup](#email-service-setup)
- [Environment Variables Reference](#environment-variables)
- [Administration](#administration)
- [Troubleshooting](#troubleshooting)

---

## 🛠️ Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (Local or Atlas)
- **Git**

---

## 🚀 Initial Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd LogicMantraa
   ```

2. **Install Dependencies**
   ```bash
   # Install Backend dependencies
   cd server && npm install

   # Install Frontend dependencies
   cd ../client && npm install
   ```

---

## 💾 Database Configuration

### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under "Network Access", whitelist your IP address (or `0.0.0.0/0` for development).
3. Create a database user with read/write permissions.
4. Copy the connection string (SRV) and replace `<password>` with your user's password.

### Option 2: Local MongoDB
1. Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service.
3. Default Connection String: `mongodb://localhost:27017/logicmantraa`

---

## 📧 Email Service Setup

Email is required for OTP verification and password resets.

### Gmail Configuration
1. Enable **2-Step Verification** in your Google Account.
2. Generate an **App Password**:
   - Go to Security -> 2-Step Verification -> App Passwords (at the bottom).
   - Select "Other", name it "LogicMantraa", and copy the 16-character code.
3. Use this code as your `EMAIL_PASSWORD` in the server `.env`.

---

##  Environment Variables

### Backend (`server/.env`)
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secure_string
FRONTEND_URL=http://localhost:5173

# Email Config
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Logic Mantraa
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🔑 Administration

1. **Create an Admin User**
   - Register a new account via the signup page.
   - Verify the email using the OTP sent.
   - Manually set `isAdmin: true` for that user in your MongoDB database (e.g., using MongoDB Compass or Atlas).

2. **Accessing Admin Dashboard**
   - Once logged in as an admin, the dashboard link will appear in the navigation.

---

## ❓ Troubleshooting

- **CORS Errors**: Ensure `FRONTEND_URL` in the server `.env` matches your client's running URL.
- **Connection Errors**: Verify your `MONGODB_URI` and ensure your database is running/accessible.
- **Email Errors**: Double-check your `EMAIL_USER` and `EMAIL_PASSWORD` (App Password). Ensure the firewall allows outgoing traffic on port 587.
