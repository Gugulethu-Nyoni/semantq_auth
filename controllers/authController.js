import { signupUser, loginUser, initiatePasswordReset, resetUserPassword } from '../../services/auth/service.js';
import { emailService } from '../../services/email.js';
import { successResponse, errorResponse } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import config from '../../../config/auth.js';
import { findUserByVerificationToken, verifyUserById, findUserById } from '../../models/user.js';
import { getCookieOptions } from '../../../config/cookies.js';

// Signup
export const signupHandler = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return errorResponse(res, 'All fields are required.', 400);
    }

    const { verification_token } = await signupUser({ name, email, password });

    await emailService.sendConfirmationEmail({
      to: email,
      name,
      token: verification_token
    });

    return successResponse(
      res,
      'Account created. Please check your email to verify.',
      { token: verification_token },
      200
    );

  } catch (err) {
    console.error('[AUTH] Signup error:', err);
    return errorResponse(res, err.message || 'Signup failed.', 500);
  }
};

// Confirm Email
export const confirmEmailHandler = async (req, res) => {
  const { token } = req.body;

console.log('Received token:', token);
const user = await findUserByVerificationToken(token);
console.log('User found:', user);



  if (!token) return errorResponse(res, 'Verification token missing.', 400);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await findUserByVerificationToken(token);
    if (!user) return errorResponse(res, 'Invalid or expired token.', 400);
    if (user.is_verified) return successResponse(res, 'Email already verified.', null, 200);

    await verifyUserById(user.id);
    return successResponse(res, 'Email verified successfully.', null, 200);

  } catch (err) {
    console.error('[AUTH] Email confirmation error:', err);
    return errorResponse(res, 'Invalid or expired token.', 400);
  }
};

// Login
// Login
export const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 'Email and password are required.', 400);

    console.log('[AUTH] Login attempt for:', email);

    const { user, token } = await loginUser({ email, password });

    console.log('[loginHandler] JWT token:', token);  // <-- Add this line

    console.log('[AUTH] Setting auth_token cookie with options:', getCookieOptions());
    res.cookie('auth_token', token, getCookieOptions());  // <-- This line sets cookie

    return successResponse(res, 'Login successful.', { user });

  } catch (err) {
    console.error('[AUTH] Login error:', err);
    if (err.message === 'Invalid email or password') {
      return errorResponse(res, err.message, 401);
    }
    return errorResponse(res, err.message || 'Login failed.', 500);
  }
};



// Validate Session
export const validateSessionHandler = (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) return errorResponse(res, 'No session token', 401);

    jwt.verify(token, config.jwtSecret, {
      issuer: 'authentique',
      audience: 'ui-server'
    });

    return successResponse(res, 'Session valid', { valid: true });

  } catch (err) {
    console.error('[AUTH] Session validation failed:', err);
    return errorResponse(res, 'Invalid session', 401);
  }
};

// Verify Token (for UI server)
export const verifyTokenHandler = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
        code: 'MISSING_TOKEN'
      });
    }

    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: 'authentique',
      audience: 'ui-server'
    });

    res.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
        sessionValid: true
      }
    });

  } catch (err) {
    console.error('[AUTH] Token verification error:', err);
    const errorType = err.name === 'TokenExpiredError' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';

    res.status(401).json({
      success: false,
      message: err.message,
      code: errorType,
      expiredAt: err.name === 'TokenExpiredError' ? err.expiredAt : undefined
    });
  }
};



export const getUserProfileHandler = async (req, res) => {
    try {
        // req.userId should be populated by the authenticateToken middleware
        const userId = req.userId;
        if (!userId) {
            return errorResponse(res, 'User ID not found in request context', 400); // Should not happen if middleware works
        }

        const user = await findUserById(userId); // Fetch user from DB
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Return only necessary profile data, avoid sensitive info like password hashes
        const profile = {
            id: user.id,
            email: user.email,
            name: user.name, // Assuming 'name' field exists
            // Add other profile fields you want to expose
        };

        return successResponse(res, 'User profile fetched successfully.', { profile });

    } catch (err) {
        console.error('[AUTH] Error fetching user profile:', err);
        return errorResponse(res, 'Failed to fetch user profile.', 500);
    }
};

export const logoutHandler = (req, res) => {
    try {
        // Clear the HttpOnly cookie by setting it to an expired date
        res.cookie('auth_token', '', { expires: new Date(0), httpOnly: true, path: '/', sameSite: 'Lax' });
        console.log('[AUTH] User logged out, auth_token cookie cleared.');
        return successResponse(res, 'Logged out successfully.');
    } catch (err) {
        console.error('[AUTH] Logout error:', err);
        return errorResponse(res, 'Logout failed.', 500);
    }
};


// ✅ NEW: Handle forgot password request (send reset link)
export const forgotPasswordHandler = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return errorResponse(res, 'Email is required.', 400);
        }

        const { name, token } = await initiatePasswordReset(email);

        // Always send a success response to prevent email enumeration,
        // even if the email doesn't exist in the database.
        // The actual email sending logic will handle if the user exists.
        if (token) { // Only send email if a token was generated (meaning user exists)
            await emailService.sendPasswordResetEmail({
                to: email,
                name: name,
                token: token
            });
        }
        
        return successResponse(res, 'If an account with that email exists, a password reset link has been sent.', null, 200);

    } catch (err) {
        console.error('[AUTH] Forgot password error:', err);
        return errorResponse(res, err.message || 'Failed to initiate password reset.', 500);
    }
};

// ✅ NEW: Handle actual password reset (with token)
export const resetPasswordHandler = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return errorResponse(res, 'Token and new password are required.', 400);
        }

        await resetUserPassword(token, newPassword);

        return successResponse(res, 'Password has been reset successfully.', null, 200);

    } catch (err) {
        console.error('[AUTH] Reset password error:', err);
        return errorResponse(res, err.message || 'Failed to reset password.', 500);
    }
};

