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
    import { authenticateToken } from '../lib/middleware/authMiddleware.js'; // Import your middleware

    const router = express.Router();

    // Public routes (no authentication required)
    router.post('/signup', signupHandler);
    router.post('/confirm-email', confirmEmailHandler);
    router.post('/login', loginHandler);
    router.post('/forgot-password', forgotPasswordHandler);
    router.post('/reset-password', resetPasswordHandler);

    // Protected routes (require authentication)
    // Apply authenticateToken middleware to routes that need a valid token
    router.get('/validate-session', authenticateToken, validateSessionHandler);
    router.get('/verify-token', authenticateToken, verifyTokenHandler); // For UI server to verify token
    router.get('/profile', authenticateToken, getUserProfileHandler);
    router.post('/logout', authenticateToken, logoutHandler); // Logout might clear token, but still needs to verify it was a valid user requesting it

    export default router;
    