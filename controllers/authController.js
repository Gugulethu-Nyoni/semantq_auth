import { signupUser, loginUser, initiatePasswordReset, resetUserPassword } from '../services/authService.js';
import { emailServicePromise } from '../services/email.js';
import { successResponse, errorResponse } from '../lib/utils/response.js';
import jwt from 'jsonwebtoken';
import config from '../config/auth.js';
import models from '../models/index.js';

const { findUserByVerificationToken, verifyUserById, findUserById } = models;
import { getCookieOptions } from '../config/cookies.js';


// Signup
export const signupHandler = async (req, res) => {
 try {
  const { name, email, password, ref } = req.body;

  if (!name || !email || !password) {
   return errorResponse(res, 'All required fields are required.', 400);
  }

  const { verification_token } = await signupUser({ name, email, password, ref });

  const emailService = await emailServicePromise(); // Called as a function

  await emailService.sendConfirmationEmail({ to: email, name, token: verification_token });

  return successResponse(res, {
   message: 'Account created. Please check your email to verify.',
   token: verification_token
  });

 } catch (err) {
  console.error('Signup error:', err);
  return errorResponse(res, err.message || 'Signup failed.', 500);
 }
};

// Confirm Email
export const confirmEmailHandler = async (req, res) => {
 const { token } = req.body;
 if (!token) return errorResponse(res, 'Verification token missing.', 400);

 try {
  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await findUserByVerificationToken(token);
  if (!user) return errorResponse(res, 'Invalid or expired token.', 400);
  if (user.is_verified) return successResponse(res, 'Email already verified.', null, 200);

  await verifyUserById(user.id);
  return successResponse(res, 'Email verified successfully.', null, 200);

 } catch (err) {
  console.error('[CONFIRM EMAIL] Error:', err);
  return errorResponse(res, 'Invalid or expired token.', 400);
 }
};

// Login
export const loginHandler = async (req, res) => {
 try {
  const { email, password } = req.body;
  if (!email || !password) return errorResponse(res, 'Email and password are required.', 400);

  const { user, token } = await loginUser({ email, password });
  res.cookie('auth_token', token, getCookieOptions());
  return successResponse(res, 'Login successful.', { user });

 } catch (err) {
  console.error('[LOGIN] Error:', err);
  if (err.message === 'Invalid email or password') return errorResponse(res, err.message, 401);
  return errorResponse(res, err.message || 'Login failed.', 500);
 }
};

// Validate Session
export const validateSessionHandler = (req, res) => {
 try {
  const token = req.cookies.auth_token;
  if (!token) return errorResponse(res, 'No session token', 401);

  const payload = jwt.verify(token, config.jwtSecret, { issuer: 'authentique', audience: 'ui-server' });
  return successResponse(res, 'Session valid', { valid: true, access_level: payload.access_level });

 } catch (err) {
  console.error('[VALIDATE SESSION] Error:', err);
  return errorResponse(res, 'Invalid session', 401);
 }
};

// Verify Token
export const verifyTokenHandler = async (req, res) => {
 try {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false, message: 'No authentication token provided', code: 'MISSING_TOKEN' });

  const payload = jwt.verify(token, config.jwtSecret, { issuer: 'authentique', audience: 'ui-server' });
  res.json({ success: true, data: { userId: payload.userId, email: payload.email, access_level: payload.access_level || 1, sessionValid: true } });

 } catch (err) {
  const errorType = err.name === 'TokenExpiredError' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';
  res.status(401).json({ success: false, message: err.message, code: errorType, expiredAt: err.expiredAt });
 }
};

// Get User Profile
export const getUserProfileHandler = async (req, res) => {
 try {
  const userId = req.userId;
  if (!userId) return errorResponse(res, 'User ID not found in request context', 400);

  const user = await findUserById(userId);
  if (!user) return errorResponse(res, 'User not found', 404);

  const profile = { id: user.id, email: user.email, name: user.name, access_level: user.access_level };
  return successResponse(res, 'User profile fetched successfully.', { profile });

 } catch (err) {
  console.error('[GET PROFILE] Error:', err);
  return errorResponse(res, 'Failed to fetch user profile.', 500);
 }
};

// Logout
export const logoutHandler = (req, res) => {
 try {
  res.cookie('auth_token', '', { expires: new Date(0), httpOnly: true, path: '/', sameSite: 'Lax' });
  return successResponse(res, 'Logged out successfully.');
 } catch (err) {
  console.error('[LOGOUT] Error:', err);
  return errorResponse(res, 'Logout failed.', 500);
 }
};

// Forgot Password
export const forgotPasswordHandler = async (req, res) => {
 try {
  const { email } = req.body;
  if (!email) return errorResponse(res, 'Email is required.', 400);

  const { name, token } = await initiatePasswordReset(email);

  if (token) {
   const emailService = await emailServicePromise(); // ✅ FIXED
   await emailService.sendPasswordResetEmail({ to: email, name, token });
  }

  return successResponse(res, 'If an account with that email exists, a password reset link has been sent.', null, 200);

 } catch (err) {
  console.error('[FORGOT PASSWORD] Error:', err);
  return errorResponse(res, err.message || 'Failed to initiate password reset.', 500);
 }
};

// Reset Password
export const resetPasswordHandler = async (req, res) => {
 try {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return errorResponse(res, 'Token and new password are required.', 400);

  await resetUserPassword(token, newPassword);
  return successResponse(res, 'Password has been reset successfully.', null, 200);

 } catch (err) {
  console.error('[RESET PASSWORD] Error:', err);
  return errorResponse(res, err.message || 'Failed to reset password.', 500);
 }
};

console.log('✅ [AUTH CONTROLLER] All handlers loaded');
