import jwt from 'jsonwebtoken';
import config from '../../config/auth.js';
import { errorResponse } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
    let token = null;

    // 1. Check for Bearer Token in Authorization header (API Clients)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('[AUTH Middleware] Token found in Authorization header (API mode).');
    }

    // 2. Fallback to Session Cookie (Web App Clients)
    if (!token && req.cookies.auth_token) {
        token = req.cookies.auth_token;
        console.log('[AUTH Middleware] Token found in cookie (Web App mode).');
    }

    // --- Failure Check ---
    if (!token) {
        console.log('[AUTH Middleware] No token provided (Header or Cookie).');
        return errorResponse(res, 'Authentication required', 401);
    }

    // --- Token Verification ---
    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            issuer: 'authentique',
            audience: 'ui-server'
        });

        // Attach user info to the request object
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userAccessLevel = decoded.access_level; 
        
        console.log(`[AUTH Middleware] Token verified for userId: ${req.userId}, access_level: ${req.userAccessLevel}`);
        next();
    } catch (err) {
        console.error('[AUTH Middleware] Token verification failed:', err);

        // Clear invalid cookie for browser safety (assuming it's httpOnly and secure)
        if (req.cookies.auth_token) {
             res.clearCookie('auth_token', { httpOnly: true, secure: true, path: '/' }); 
        }

        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Session expired. Please log in again.', 401);
        }
        return errorResponse(res, 'Invalid or malformed token', 403);
    }
};