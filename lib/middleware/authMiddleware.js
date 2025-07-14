// semantq_auth/lib/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import config from '../../config/auth.js';
import { errorResponse } from '../utils/response.js';

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
        req.userAccessLevel = decoded.access_level; // Extract access_level from JWT and attach to request
        console.log(`[AUTH Middleware] Token verified for userId: ${req.userId}, access_level: ${req.userAccessLevel}`);
        next();
    } catch (err) {
        console.error('[AUTH Middleware] Token verification failed:', err);
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Session expired. Please log in again.', 401);
        }
        return errorResponse(res, 'Invalid or malformed token', 403);
    }
};