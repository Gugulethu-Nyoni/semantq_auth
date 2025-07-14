// semantq_auth/lib/middleware/authorize.js

// semantq_auth/lib/middleware/authorize.js
import { errorResponse } from '../utils/response.js';

export const authorize = (requiredAccessLevel) => {
  return (req, res, next) => {
    if (!req.userAccessLevel) {
      // If authenticateToken middleware didn't attach an access_level, something is wrong
      console.warn('[Authorization Middleware] No user access_level found on request.');
      return errorResponse(res, 'Authorization failed: User access level not found.', 403);
    }

    const userLevel = parseInt(req.userAccessLevel, 10);
    const requiredLevel = parseInt(requiredAccessLevel, 10);

    if (isNaN(userLevel) || isNaN(requiredLevel)) {
      console.error(`[Authorization Middleware] Invalid access_level type: userLevel=${req.userAccessLevel}, requiredLevel=${requiredAccessLevel}`);
      return errorResponse(res, 'Authorization failed: Invalid access level configuration.', 500);
    }

    // A user's access_level must be greater than or equal to the required access_level
    if (userLevel >= requiredLevel) {
      console.log(`[Authorization Middleware] User (access_level: ${req.userAccessLevel}) authorized for required access_level: ${requiredAccessLevel}`);
      next(); // User has sufficient privileges
    } else {
      console.warn(`[Authorization Middleware] User (access_level: ${req.userAccessLevel}) denied access for required access_level: ${requiredAccessLevel}`);
      return errorResponse(res, 'Access denied: Insufficient privileges.', 403);
    }
  };
};