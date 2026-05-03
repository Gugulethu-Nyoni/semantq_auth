// semantq_auth/controllers/authController.js
import { signupUser, loginUser, initiatePasswordReset, resetUserPassword } from '../services/authService.js';
import { emailServicePromise } from '../services/email.js';
import { successResponse, errorResponse } from '../lib/utils/response.js';
import jwt from 'jsonwebtoken';
import config from '../config/auth.js';
import models from '../models/index.js';

const { findUserByVerificationToken, verifyUserById, findUserById } = models;
import { getCookieOptions } from '../config/cookies.js';


// Signup - UPDATED to accept username
export const signupHandler = async (req, res) => {
 try {
  const { name, email, password, username, ref } = req.body;

  if (!name || !email || !password) {
   return errorResponse(res, 'All required fields are required.', 400);
  }

  if (username) {
    if (username.length < 3) {
      return errorResponse(res, 'Username must be at least 3 characters long.', 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return errorResponse(res, 'Username can only contain letters, numbers, and underscores.', 400);
    }
  }

  const { verification_token } = await signupUser({ name, email, password, username, ref });

  const emailService = await emailServicePromise();

  await emailService.sendConfirmationEmail({ to: email, name, token: verification_token });

  return successResponse(res, 'Account created. Please check your email to verify.', { token: verification_token });

 } catch (err) {
  console.error('Signup error:', err);
  
  // Return specific error messages to frontend
  let errorMessage = err.message;
  let statusCode = 500;
  
  if (err.message === 'Email is already registered.') {
    errorMessage = 'This email is already registered. Please login instead.';
    statusCode = 409;
  } else if (err.message === 'Username is already taken.') {
    errorMessage = 'This username is already taken. Please choose another one.';
    statusCode = 409;
  }
  
  return errorResponse(res, errorMessage, statusCode);
 }
};

// Confirm Email
export const confirmEmailHandler = async (req, res) => {
 const { token } = req.body;
 if (!token) return errorResponse(res, 'Verification token missing. Please check your email link.', 400);

 try {
  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await findUserByVerificationToken(token);
  if (!user) return errorResponse(res, 'Invalid or expired verification link. Please request a new one.', 400);
  if (user.is_verified) return successResponse(res, 'Email already verified. You can now login.', null, 200);

  await verifyUserById(user.id);
  return successResponse(res, 'Email verified successfully! You can now login.', null, 200);

 } catch (err) {
  console.error('[CONFIRM EMAIL] Error:', err);
  return errorResponse(res, 'Invalid or expired verification link. Please request a new one.', 400);
 }
};

// Login - UPDATED to accept identifier (email or username)
export const loginHandler = async (req, res) => {
 try {
  const identifier = req.body.identifier || req.body.email;
  const { password } = req.body;
  
  if (!identifier || !password) {
    return errorResponse(res, 'Email/username and password are required.', 400);
  }

  const { user, token } = await loginUser({ identifier, password });
  res.cookie('auth_token', token, getCookieOptions());
  return successResponse(res, 'Login successful. Welcome back!', { user });

 } catch (err) {
  console.error('[LOGIN] Error:', err);
  
  let errorMessage = err.message;
  let statusCode = 401;
  
  if (err.message === 'Invalid email/username or password.') {
    errorMessage = 'Invalid email/username or password. Please try again.';
  } else if (err.message === 'Please verify your email before logging in.') {
    errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification link.';
  } else {
    statusCode = 500;
    errorMessage = err.message || 'Login failed. Please try again later.';
  }
  
  return errorResponse(res, errorMessage, statusCode);
 }
};

// Validate Session
export const validateSessionHandler = async (req, res) => {
 try {
  const token = req.cookies.auth_token;
  if (!token) return errorResponse(res, 'No active session found. Please login.', 401);

  const payload = jwt.verify(token, config.jwtSecret, { issuer: 'authentique', audience: 'ui-server' });
  
  let organizationId = null;
  
  try {
    if (typeof findUserById === 'function') {
      const user = await findUserById(payload.userId);
      organizationId = user?.organizationId || null;
    }
  } catch (err) {
    console.log('[VALIDATE SESSION] Organization ID fetch skipped or failed:', err.message);
  }
  
  return successResponse(res, 'Session valid', { 
    valid: true, 
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    access_level: payload.access_level,
    organizationId: organizationId 
  });

 } catch (err) {
  console.error('[VALIDATE SESSION] Error:', err);
  
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Your session has expired. Please login again.', 401);
  }
  return errorResponse(res, 'Invalid session. Please login again.', 401);
 }
};

// Verify Token
export const verifyTokenHandler = async (req, res) => {
 try {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false, message: 'No authentication token found. Please login.', code: 'MISSING_TOKEN' });

  const payload = jwt.verify(token, config.jwtSecret, { issuer: 'authentique', audience: 'ui-server' });
  res.json({ 
    success: true, 
    data: { 
      userId: payload.userId, 
      email: payload.email, 
      username: payload.username,
      access_level: payload.access_level || 1, 
      sessionValid: true 
    } 
  });

 } catch (err) {
  const errorType = err.name === 'TokenExpiredError' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';
  const errorMessage = err.name === 'TokenExpiredError' ? 'Your session has expired. Please login again.' : 'Invalid authentication token. Please login again.';
  res.status(401).json({ success: false, message: errorMessage, code: errorType, expiredAt: err.expiredAt });
 }
};

// Get User Profile
export const getUserProfileHandler = async (req, res) => {
 try {
  const userId = req.userId;
  if (!userId) return errorResponse(res, 'User ID not found in request context', 400);

  const user = await findUserById(userId);
  if (!user) return errorResponse(res, 'User profile not found.', 404);

  const profile = { 
    id: user.id, 
    email: user.email, 
    username: user.username,
    name: user.name, 
    access_level: user.access_level 
  };
  return successResponse(res, 'User profile fetched successfully.', { profile });

 } catch (err) {
  console.error('[GET PROFILE] Error:', err);
  return errorResponse(res, 'Failed to fetch user profile. Please try again later.', 500);
 }
};

// Logout
export const logoutHandler = (req, res) => {
 try {
  res.cookie('auth_token', '', { expires: new Date(0), httpOnly: true, path: '/', sameSite: 'Lax' });
  return successResponse(res, 'Logged out successfully. See you next time!');
 } catch (err) {
  console.error('[LOGOUT] Error:', err);
  return errorResponse(res, 'Logout failed. Please try again.', 500);
 }
};

// Forgot Password
export const forgotPasswordHandler = async (req, res) => {
 try {
  const { email } = req.body;
  if (!email) return errorResponse(res, 'Email address is required.', 400);

  const { name, token } = await initiatePasswordReset(email);

  if (token) {
   const emailService = await emailServicePromise();
   await emailService.sendPasswordResetEmail({ to: email, name, token });
  }

  return successResponse(res, 'If an account exists with this email, you will receive a password reset link.', null, 200);

 } catch (err) {
  console.error('[FORGOT PASSWORD] Error:', err);
  return errorResponse(res, 'Unable to process password reset request. Please try again later.', 500);
 }
};

// Reset Password
export const resetPasswordHandler = async (req, res) => {
 try {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return errorResponse(res, 'Reset token and new password are required.', 400);
  
  if (newPassword.length < 8) {
    return errorResponse(res, 'Password must be at least 8 characters long.', 400);
  }

  await resetUserPassword(token, newPassword);
  return successResponse(res, 'Password has been reset successfully. You can now login with your new password.', null, 200);

 } catch (err) {
  console.error('[RESET PASSWORD] Error:', err);
  
  let errorMessage = err.message;
  if (err.message === 'Invalid or expired password reset token.') {
    errorMessage = 'This password reset link is invalid or has expired. Please request a new one.';
  }
  
  return errorResponse(res, errorMessage || 'Failed to reset password. Please try again.', 400);
 }
};

console.log('[AUTH CONTROLLER] All handlers loaded');