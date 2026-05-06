# Backend Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Logic Mantraa backend.

## 🛡️ Security Features Implemented

### 1. Security Headers (Helmet)
- **Content Security Policy**: Strict CSP with allowed sources
- **HSTS**: HTTP Strict Transport Security with preload
- **X-Frame-Options**: DENY to prevent clickjacking
- **X-Content-Type-Options**: nosniff to prevent MIME type sniffing
- **X-XSS-Protection**: Block mode for XSS protection
- **Referrer Policy**: strict-origin-when-cross-origin
- **Permissions Policy**: Disabled geolocation, camera, microphone

### 2. Rate Limiting
- **General API**: 1000 requests per 15 minutes
- **Authentication**: 5 login attempts per 15 minutes
- **OTP Requests**: 3 OTP requests per 10 minutes
- **Password Reset**: 3 reset attempts per hour
- **Registration**: 3 registrations per hour per IP

### 3. Input Sanitization
- **XSS Protection**: Custom XSS sanitizer with whitelist
- **MongoDB Injection**: Prevents NoSQL injection attacks
- **HTML Sanitization**: Safe HTML tags only for rich text
- **File Upload Validation**: Type and size validation
- **Circular Reference Detection**: Prevents JSON payload attacks

### 4. CORS Configuration
- **Environment-based**: Different configs for dev/staging/prod
- **Strict Origin Checking**: Only allowed domains
- **Secure Headers**: Additional security headers
- **Preflight Caching**: 24-hour cache for OPTIONS requests

### 5. JWT Security
- **No Fallback Secrets**: Environment-only JWT secrets
- **Token Validation**: Issuer and audience validation
- **Separate Refresh Tokens**: Different secret for refresh tokens
- **Expiration Controls**: Configurable token lifetimes

## 🚀 Usage Instructions

### Environment Variables Required
```bash
# Required
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
MONGODB_URI=your_mongodb_connection_string

# Optional
JWT_ISSUER=logicmantraa
JWT_AUDIENCE=logicmantraa-users
JWT_EXPIRES_IN=30d
NODE_ENV=production
```

### Starting the Secure Server
```bash
# Use the secure server configuration
node src/server_secure.js
```

### Security Endpoints
```bash
# Health check
GET /health

# Security status
GET /api/security/headers
```

## 🔧 Security Middleware Stack

### Applied in Order:
1. **Helmet** - Security headers
2. **CORS** - Cross-origin protection
3. **Body Parser** - Request parsing with limits
4. **Security Middleware** - XSS, MongoDB, HPP protection
5. **Input Sanitization** - Comprehensive input cleaning
6. **Rate Limiting** - Request throttling

### Route-Specific Protection:
- **Auth Routes**: Strict rate limiting + input sanitization
- **API Routes**: General rate limiting + security middleware
- **Admin Routes**: Additional authorization checks

## 🛠️ Configuration Files

### Security Middleware: `src/middleware/security.js`
- Helmet configuration
- Rate limiting setup
- XSS and MongoDB protection
- Input validation rules

### CORS Configuration: `src/middleware/cors.js`
- Environment-based CORS rules
- Origin validation
- Header management

### Input Sanitization: `src/middleware/inputSanitizer.js`
- XSS protection with whitelist
- MongoDB injection prevention
- File upload validation
- JSON payload validation

### Secure Server: `src/server_secure.js`
- Complete security stack
- Environment validation
- Graceful shutdown handling
- Error management

## 🔍 Security Testing

### Test Scenarios:
1. **XSS Protection**: Try injecting scripts in form fields
2. **Rate Limiting**: Exceed request limits
3. **CORS Violation**: Test from unauthorized origins
4. **Large Payloads**: Send oversized requests
5. **MongoDB Injection**: Attempt NoSQL injection
6. **JWT Validation**: Test with invalid tokens

### Security Headers Check:
```bash
curl -I http://localhost:5000/health
```

Expected headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'...`

## 🚨 Security Monitoring

### Rate Limit Headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

### Error Handling:
- Sanitized error messages
- No stack traces in production
- Consistent error format

### Logging:
- Security violations logged
- Rate limit breaches tracked
- CORS violations recorded

## 📋 Security Checklist

### ✅ Implemented:
- [x] Security headers (Helmet)
- [x] Rate limiting
- [x] Input sanitization
- [x] CORS protection
- [x] JWT security
- [x] MongoDB injection protection
- [x] XSS protection
- [x] File upload validation
- [x] Environment validation
- [x] Graceful shutdown

### 🔧 Recommended Next Steps:
- [ ] Implement API key authentication
- [ ] Add request logging
- [ ] Set up security monitoring
- [ ] Implement IP whitelisting for admin
- [ ] Add CSRF protection for state-changing operations
- [ ] Implement content security policy reporting
- [ ] Set up automated security scanning

## 🚨 Important Notes

1. **Environment Variables**: Never commit secrets to version control
2. **Production Deployment**: Use HTTPS in production
3. **Database Security**: Use MongoDB authentication and encryption
4. **Monitoring**: Set up alerts for security violations
5. **Regular Updates**: Keep dependencies updated
6. **Security Testing**: Regular penetration testing

## 📞 Support

For security issues or questions:
- Review the implementation files
- Check the security middleware configurations
- Test with the provided endpoints
- Monitor server logs for security events

---

**Security is an ongoing process. Regular reviews and updates are essential.**
