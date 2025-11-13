import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_should_be_changed');

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        return res.json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      return res.json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401);
    return res.json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    return res.json({ message: 'Not authorized as an admin' });
  }
};