// src/http/middleware/authenticate.js
import jwt from 'jsonwebtoken';
import config from '../../config/auth.js'; // Adjust path based on where you use it
import { errorResponse } from '../utils/response.js'; // Adjust path if utils is elsewhere

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) {
        console.log('[AUTH Middleware] No token provided.');
        return errorResponse(res, 'Authentication required', 401);
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            issuer: 'authentique',
            audience: 'ui-server'
        });
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        console.log(`[AUTH Middleware] Token verified for userId: ${req.userId}`);
        next();
    } catch (err) {
        console.error('[AUTH Middleware] Token verification failed:', err);
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Session expired. Please log in again.', 401);
        }
        return errorResponse(res, 'Invalid or malformed token', 403);
    }
};