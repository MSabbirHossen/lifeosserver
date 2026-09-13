import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  googleAuth,
  getUserProfile,
  updateUserProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Specific rate limiting for password login/register attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', googleAuth);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

export default router;
