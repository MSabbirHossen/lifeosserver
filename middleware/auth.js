import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_lifeos_2026'
      );
    } catch (jwtError) {
      console.warn('[Auth Middleware Notice]: JWT verification failed -', jwtError.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }

    try {
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      return next();
    } catch (dbError) {
      console.error('[Auth Middleware DB Error]:', dbError.message);
      return res.status(503).json({
        message: 'Database temporarily unavailable, please retry',
        error: dbError.message,
      });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
