/**
 * Enhanced CORS configuration with security best practices
 */

/**
 * CORS configuration with strict security
 */
export const corsConfig = {
  // Strict origin checking
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'https://logicmantraa.netlify.app',
      'https://www.logicmantraa.netlify.app',
      'https://logicmantraa.com',
      'https://www.logicmantraa.com'
    ];

    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Allow credentials
  credentials: true,
  
  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Requested-With',
    'X-Forwarded-For',
    'X-Real-IP',
    'User-Agent',
    'Referer'
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Per-Page',
    'X-Current-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Content-Range',
    'X-Content-Range'
  ],
  
  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours
  
  // Whether to pass the CORS preflight response to the next handler
  preflightContinue: false,
  
  // Options success status
  optionsSuccessStatus: 204
};

/**
 * Development CORS configuration (more permissive)
 */
export const developmentCorsConfig = {
  origin: function (origin, callback) {
    // Allow any origin in development
    if (!origin) return callback(null, true);
    
    // Common development origins
    const devOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ];
    
    if (devOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      console.warn('Development CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Production CORS configuration (most restrictive)
 */
export const productionCorsConfig = {
  origin: function (origin, callback) {
    // Only allow specific production origins
    const allowedOrigins = [
      'https://logicmantraa.netlify.app',
      'https://www.logicmantraa.netlify.app',
      'https://logicmantraa.com',
      'https://www.logicmantraa.com'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Production CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Get CORS configuration based on environment
 */
export const getCorsConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  switch (nodeEnv) {
    case 'production':
      return productionCorsConfig;
    case 'development':
      return developmentCorsConfig;
    default:
      return corsConfig;
  }
};

/**
 * Custom CORS middleware with additional security
 */
export const customCorsMiddleware = (req, res, next) => {
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Rate limiting headers
  res.setHeader('X-RateLimit-Limit', '1000');
  res.setHeader('X-RateLimit-Remaining', '999');
  res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString());
  
  next();
};

export default {
  corsConfig,
  developmentCorsConfig,
  productionCorsConfig,
  getCorsConfig,
  customCorsMiddleware
};
