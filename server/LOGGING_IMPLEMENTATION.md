# Structured Logging Implementation Guide

This document outlines the comprehensive structured logging system implemented using Winston for the Logic Mantraa backend.

## 🚀 Logging Features Implemented

### 1. Winston Logger Configuration (`src/config/logger.js`)
- **Multiple Transports**: Console, file, and daily rotation
- **Structured JSON Format**: Consistent log structure
- **Log Levels**: error, warn, info, debug
- **File Rotation**: Daily log files with size limits
- **Error Handling**: Uncaught exceptions and rejections

### 2. Log Files Structure
```
logs/
├── combined-YYYY-MM-DD.log     # All logs (info and above)
├── error-YYYY-MM-DD.log        # Error logs only
├── debug-YYYY-MM-DD.log        # Debug logs (development only)
├── exceptions-YYYY-MM-DD.log   # Uncaught exceptions
└── rejections-YYYY-MM-DD.log   # Unhandled rejections
```

### 3. Log Categories

#### **Request Logging**
- All HTTP requests with method, URL, status code
- Response time tracking
- User identification
- Request ID tracking

#### **Authentication Logging**
- Login attempts (success/failure)
- Registration events
- Password changes
- OTP verification
- Security events

#### **Business Logging**
- Course creation/updates/deletion
- Enrollment events
- Rating submissions
- Purchase transactions

#### **Error Logging**
- Stack traces for all errors
- Request context
- User information
- System state

#### **Security Logging**
- Suspicious input detection
- Failed authentication attempts
- Password reset requests
- Unauthorized access attempts

## 🛠️ Configuration Files

### Logger Configuration: `src/config/logger.js`
```javascript
// Main logger with multiple transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  transports: [
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});
```

### Request Logging Middleware: `src/middleware/requestLogger.js`
```javascript
// Comprehensive request logging
export const requestLogger = (req, res, next) => {
  req.requestId = generateRequestId();
  const startTime = Date.now();
  
  res.on('finish', () => {
    logger.logRequest(req, res, Date.now() - startTime);
  });
  
  next();
};
```

## 📊 Log Format Examples

### **Request Log Entry**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "HTTP 200 - GET /api/courses",
  "requestId": "abc123def456",
  "method": "GET",
  "url": "/api/courses",
  "statusCode": 200,
  "responseTime": "45ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "userId": "user123",
  "service": "logicmantraa-api",
  "environment": "production"
}
```

### **Authentication Log Entry**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "Auth: login_successful",
  "event": "login_successful",
  "userId": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "timestamp": "2024-01-15T10:30:45.000Z",
  "service": "logicmantraa-api",
  "environment": "production"
}
```

### **Error Log Entry**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "error",
  "message": "API Error",
  "error": {
    "message": "User not found",
    "stack": "Error: User not found\n    at UserService.findById...",
    "name": "NotFoundError"
  },
  "requestId": "abc123def456",
  "method": "GET",
  "url": "/api/users/nonexistent",
  "userId": "user123",
  "service": "logicmantraa-api",
  "environment": "production"
}
```

### **Business Event Log Entry**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "Business: course_created",
  "event": "course_created",
  "requestId": "abc123def456",
  "courseId": "course123",
  "title": "JavaScript Fundamentals",
  "instructor": "John Doe",
  "userId": "user123",
  "category": "Programming",
  "level": "Beginner",
  "price": 99.99,
  "timestamp": "2024-01-15T10:30:45.000Z",
  "service": "logicmantraa-api",
  "environment": "production"
}
```

## 🔧 Usage Examples

### **Basic Logging**
```javascript
import logger from '../config/logger.js';

logger.info('User action completed', { userId, action });
logger.error('Database connection failed', error, { retryCount });
logger.warn('Rate limit exceeded', { ip, userId });
logger.debug('Cache miss', { key, type });
```

### **Request Logging**
```javascript
// Automatic request logging
app.use(requestLogger);

// Manual request logging
logger.logRequest(req, res, responseTime);
```

### **Authentication Logging**
```javascript
logger.logAuth('login_attempt', null, { email });
logger.logAuth('login_successful', userId, { email, name });
logger.logAuth('password_reset_successful', userId, { email });
```

### **Security Logging**
```javascript
logger.logSecurity('suspicious_input_detected', {
  requestId,
  ip,
  suspiciousContent,
  pattern
});
```

### **Business Logging**
```javascript
logger.logBusiness('course_created', {
  courseId,
  title,
  instructor,
  userId
});
```

### **Error Logging**
```javascript
logger.logApiError(error, req, {
  additionalContext: 'Additional info'
});
```

## 📈 Logging Levels

### **Level Hierarchy**
1. **error** - Errors that need immediate attention
2. **warn** - Warning messages for potential issues
3. **info** - General information about application flow
4. **debug** - Detailed debugging information

### **Level Configuration**
```bash
# Environment variables
LOG_LEVEL=info          # Default level
NODE_ENV=production     # Production environment
```

## 🔍 Log Analysis

### **Common Log Patterns**
- **Performance**: Response times > 500ms
- **Errors**: 5xx status codes
- **Security**: Failed login attempts
- **Business**: Course enrollments, purchases

### **Log Queries**
```bash
# Find all errors in the last hour
grep "level\":\"error" logs/combined-$(date +%Y-%m-%d).log

# Find all login attempts
grep "Auth:" logs/combined-$(date +%Y-%m-%d).log

# Find slow requests
grep "responseTime.*[0-9]{3}ms" logs/combined-$(date +%Y-%m-%d).log
```

## 🚨 Important Notes

### **Environment Variables**
```bash
# Logging configuration
LOG_LEVEL=info
NODE_ENV=production

# Log file paths (optional)
LOG_DIR=./logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

### **Security Considerations**
- **Sensitive Data**: Passwords, tokens automatically redacted
- **PII**: Personal information handled carefully
- **Log Rotation**: Prevents disk space issues
- **Access Control**: Log files should have restricted access

### **Performance Considerations**
- **Async Logging**: Non-blocking log writes
- **Buffering**: Batch log writes for efficiency
- **Compression**: Consider log file compression
- **Sampling**: Sample debug logs in high-traffic scenarios

## 📋 Implementation Checklist

### ✅ Completed:
- [x] Winston logger configuration
- [x] Daily rotating file transports
- [x] Request logging middleware
- [x] Error logging with stack traces
- [x] Authentication event logging
- [x] Business event logging
- [x] Security event logging
- [x] Performance logging
- [x] Structured JSON format
- [x] Environment-based configuration

### 🔧 Recommended Next Steps:
- [ ] Implement log aggregation (ELK stack)
- [ ] Add log monitoring and alerts
- [ ] Implement log sampling for high traffic
- [ ] Add log compression
- [ ] Create log analysis dashboards
- [ ] Implement distributed tracing
- [ ] Add log-based metrics
- [ ] Create log retention policies

## 🔧 Integration Examples

### **Express App Integration**
```javascript
import logger from './config/logger.js';
import { requestLogger, errorLogger } from './middleware/requestLogger.js';

// Add logging middleware
app.use(requestLogger);
app.use(errorLogger);

// Error handling
app.use((error, req, res, next) => {
  logger.logApiError(error, req);
  next(error);
});
```

### **Service Integration**
```javascript
import logger from '../config/logger.js';

class UserService {
  static async createUser(userData) {
    try {
      logger.info('User creation attempt', { email: userData.email });
      
      const user = await User.create(userData);
      
      logger.logBusiness('user_created', {
        userId: user._id,
        email: user.email
      });
      
      return user;
    } catch (error) {
      logger.error('User creation failed', error, { email: userData.email });
      throw error;
    }
  }
}
```

## 📊 Log Monitoring

### **Key Metrics to Monitor**
- **Error Rate**: Percentage of error logs
- **Response Time**: Average response times
- **Authentication Failures**: Failed login attempts
- **Business Events**: Course enrollments, purchases
- **Security Events**: Suspicious activities

### **Alerting Rules**
- High error rate (> 5%)
- Slow responses (> 2s)
- Failed authentication (> 10/min)
- Disk space (log files > 80%)

## 📞 Support

For logging issues or questions:
- Check log file permissions
- Verify environment variables
- Review log rotation settings
- Check disk space
- Monitor log levels

---

**Structured logging is essential for production monitoring and debugging. Regular log review and analysis are recommended.**
