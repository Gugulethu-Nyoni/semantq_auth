// semantq_auth/routes/authRoutes.js
import express from 'express';
import {
  signupHandler,
  confirmEmailHandler,
  loginHandler,
  validateSessionHandler,
  verifyTokenHandler,
  getUserProfileHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler
} from '../controllers/authController.js';
import { authenticateToken } from '../lib/middleware/authMiddleware.js';
import { authorize } from '../lib/middleware/authorize.js'; // NEW: Your authorization middleware

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', signupHandler);
router.post('/confirm', confirmEmailHandler);
router.post('/login', loginHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

// Protected routes (require authentication)
router.get('/validate-session', authenticateToken, validateSessionHandler);
router.get('/verify-token', authenticateToken, verifyTokenHandler);
router.get('/profile', authenticateToken, getUserProfileHandler);
router.post('/logout', authenticateToken, logoutHandler);

// NEW: Example of a route requiring access_level 3 (Admin)
router.get('/admin-dashboard', authenticateToken, authorize(3), (req, res) => {
  res.json({ success: true, message: 'Welcome to the Admin Dashboard!', userId: req.userId, userAccessLevel: req.userAccessLevel });
});

// NEW: Example of a route requiring access_level 2 (Editor/Moderator)
router.post('/create-article', authenticateToken, authorize(2), (req, res) => {
  res.json({ success: true, message: 'Article created successfully by editor!', userId: req.userId, userAccessLevel: req.userAccessLevel });
});

export default router;