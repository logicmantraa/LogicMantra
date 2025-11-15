# Complete Setup Guide - Logic Mantraa

This guide will walk you through setting up the Logic Mantraa platform from scratch, including all required configurations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [MongoDB Setup](#mongodb-setup)
- [Email Configuration](#email-configuration)
- [Cloudinary Setup (Optional)](#cloudinary-setup-optional)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Creating Admin User](#creating-admin-user)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account) - [Download](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

---

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LogicMantraa
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

---

## MongoDB Setup

### Option 1: Local MongoDB Installation

1. **Install MongoDB Community Edition**
   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your operating system
   - Start MongoDB service

2. **Verify Installation**
   ```bash
   mongod --version
   ```

3. **Connection String**
   - Default: `mongodb://localhost:27017/logicmantraa`
   - MongoDB will create the database automatically on first connection

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create"

3. **Configure Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Create username and password (save these!)
   - Set user privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `logicmantraa` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/logicmantraa`

---

## Email Configuration

Email notifications are used for:
- User registration (OTP verification)
- Welcome emails
- Contact form confirmations
- Course enrollment confirmations
- Admin notifications

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Step Verification**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to "Security" → "2-Step Verification"
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Still in Security settings, find "App passwords"
   - Click "App passwords" (you may need to sign in again)
   - Select "Mail" as the app
   - Select "Other (Custom name)" as device, enter "Logic Mantraa"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

3. **Add to Environment Variables**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM_NAME=Logic Mantraa
   ```

### Option 2: SendGrid

1. **Create Account**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for a free account (100 emails/day free)

2. **Create API Key**
   - Go to "Settings" → "API Keys"
   - Click "Create API Key"
   - Name it (e.g., "Logic Mantraa")
   - Select "Mail Send" permissions
   - Click "Create & View"
   - **Copy the API key** (you won't see it again!)

3. **Add to Environment Variables**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM_NAME=Logic Mantraa
   ```

### Option 3: Mailgun

1. **Create Account**
   - Go to [Mailgun](https://mailgun.com/)
   - Sign up for a free account (5,000 emails/month free)

2. **Get SMTP Credentials**
   - Go to "Sending" → "Domain Settings"
   - Find "SMTP credentials" section
   - Copy the SMTP username and password

3. **Add to Environment Variables**
   ```env
   EMAIL_HOST=smtp.mailgun.org
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-mailgun-smtp-username
   EMAIL_PASSWORD=your-mailgun-smtp-password
   EMAIL_FROM_NAME=Logic Mantraa
   ```

### Option 4: Custom SMTP Server

For any other SMTP provider (Outlook, Yahoo, custom server):

```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM_NAME=Logic Mantraa
```

**Note**: For port 465 (SSL), set `EMAIL_SECURE=true`

### Testing Email Configuration

When you start the server, check the console:
- `Email server is ready to send messages` - Configuration is correct
- `Email configuration error: ...` - Check your credentials

---

## Cloudinary Setup (Optional)

Cloudinary is used for cloud-based file storage (images, PDFs, etc.). Currently, the project uses local file storage via Multer, but Cloudinary can be integrated for production.

### Why Use Cloudinary?

- **Scalability**: Handle large files and high traffic
- **CDN**: Fast global content delivery
- **Image Optimization**: Automatic resizing, compression, format conversion
- **Storage**: No local storage limitations

### Setup Steps

1. **Create Account**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Sign up for a free account (25GB storage, 25GB bandwidth/month)

2. **Get Credentials**
   - After signup, you'll see your dashboard
   - Copy the following from your dashboard:
     - Cloud Name
     - API Key
     - API Secret

3. **Add to Environment Variables**
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Integration (Future)**
   - Currently, files are stored locally in `server/uploads/`
   - To use Cloudinary, you'll need to:
     - Update `server/src/config/upload.js` to use Cloudinary
     - Modify resource controllers to upload to Cloudinary
     - Update file URLs in the database

### Current File Storage

Files are currently stored locally in `server/uploads/` directory. Make sure this directory exists:

```bash
mkdir -p server/uploads
```

---

## Environment Variables

### Backend Environment Variables (`server/.env`)

Create a `.env` file in the `server` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/logicmantraa
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/logicmantraa

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_generate_random_string

# Email Configuration (Required for email verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Logic Mantraa
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration (Optional - for cloud file storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend Environment Variables (`client/.env`)

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Generating JWT Secret

You can generate a secure JWT secret using:

**Option 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Online Generator**
- Use any secure random string generator
- Minimum 32 characters recommended

**Option 3: Manual**
- Create a long random string (at least 32 characters)
- Mix of letters, numbers, and special characters

---

## Running the Application

### Development Mode

#### Terminal 1: Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
Server running on port 5000
Connected to MongoDB
Email server is ready to send messages
```

#### Terminal 2: Start Frontend Development Server

```bash
cd client
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Production Mode

#### Build Frontend

```bash
cd client
npm run build
```

This creates a `dist` folder with optimized production files.

#### Start Backend (Production)

```bash
cd server
npm start
```

**Note**: Make sure to set `NODE_ENV=production` in your production `.env` file.

---

## Creating Admin User

By default, all registered users are students. To create an admin user:

### Method 1: MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `users` collection
4. Find the user you want to make admin
5. Edit the document
6. Set `isAdmin: true`
7. Save

### Method 2: MongoDB Shell

```javascript
use logicmantraa
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { isAdmin: true } }
)
```

### Method 3: After Registration

1. Register a new user normally
2. Verify email with OTP
3. Use MongoDB Compass or shell to set `isAdmin: true`

---

## Troubleshooting

### MongoDB Connection Issues

**Problem**: "MongoDB connection error"

**Solutions**:
- Check if MongoDB is running: `mongod --version`
- Verify `MONGO_URI` in `.env` is correct
- For Atlas: Check network access (IP whitelist)
- For Atlas: Verify username/password in connection string
- Check firewall settings

### Email Not Sending

**Problem**: "Email configuration error" or emails not received

**Solutions**:
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- For Gmail: Use App Password, not regular password
- Check spam folder
- Verify 2-Step Verification is enabled (Gmail)
- Test SMTP settings with a simple email client
- Check server console for specific error messages

### Port Already in Use

**Problem**: "Port 5000 is already in use"

**Solutions**:
- Change `PORT` in `server/.env` to a different port (e.g., 5001)
- Update `VITE_API_URL` in `client/.env` to match
- Or kill the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill
  ```

### Frontend Can't Connect to Backend

**Problem**: API requests failing, CORS errors

**Solutions**:
- Verify `VITE_API_URL` in `client/.env` matches backend URL
- Check backend is running on correct port
- Verify CORS settings in `server/src/server.js`
- Check browser console for specific errors
- Ensure backend allows your frontend origin

### Login Issues After Email Verification

**Problem**: Can't login after successful email verification

**Solutions**:
- Check if email is stored in lowercase in database
- Verify password wasn't double-hashed (check User model pre-save hook)
- Check server logs for authentication errors
- Try resetting password if available

### File Upload Issues

**Problem**: File uploads failing

**Solutions**:
- Ensure `server/uploads/` directory exists
- Check file size limits (default: 10MB)
- Verify file types are allowed (PDF, images, documents)
- Check server logs for multer errors
- Verify disk space available

### Module Not Found Errors

**Problem**: "Cannot find module" errors

**Solutions**:
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Verify you're in the correct directory
- Check `package.json` for all dependencies

---

## Verification Checklist

After setup, verify everything works:

- [ ] Backend server starts without errors
- [ ] Frontend development server starts
- [ ] MongoDB connection successful
- [ ] Email configuration verified (check server console)
- [ ] Can register a new user
- [ ] OTP email received
- [ ] Email verification works
- [ ] Can login after verification
- [ ] Admin user created (if needed)
- [ ] Can access admin dashboard
- [ ] File uploads work (if testing)

---

## Next Steps

1. **Create Admin User**: Follow instructions above
2. **Add Courses**: Login as admin and create courses
3. **Test Features**: Register, enroll, watch lectures
4. **Configure Production**: Set up production environment variables
5. **Deploy**: Deploy to hosting platforms (Netlify, Vercel, Heroku, etc.)

---

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## Support

If you encounter issues not covered here:
1. Check server console logs for error messages
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Check MongoDB connection
6. Review this guide again

For additional help, create an issue in the repository.

