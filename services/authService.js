// semantq_auth/services/authService.js
import models from '../models/index.js';
import { hashPassword, comparePassword } from './password.js';
import { generateVerificationToken, generateAuthToken, generatePasswordResetToken } from './strategies/jwt.js';
import { emailServicePromise } from './email.js';

export const signupUser = async ({ name, email, password, username, ref, sendEmail = true }) => {
  console.log('[signupUser] Starting signup for:', email, username ? `username: ${username}` : '');

  // Check if email already exists
  const existingUserByEmail = await models.findUserByEmail(email);
  if (existingUserByEmail) {
    console.log('[signupUser] Email already registered:', email);
    throw new Error('Email is already registered.');
  }

  // Check if username already exists (if provided)
  if (username) {
    const existingUserByUsername = await models.findUserByUsername(username);
    if (existingUserByUsername) {
      console.log('[signupUser] Username already taken:', username);
      throw new Error('Username is already taken.');
    }
  }

  const password_hash = await hashPassword(password);
  console.log('[signupUser] Password hashed');

  const { token, expiresAt } = generateVerificationToken({ email });
  console.log('[signupUser] Generated token:', token, 'Expires at:', expiresAt);

  // Convert ref to access_level, fallback to 1 if ref is not a valid number
  let access_level = 1;
  if (ref !== undefined && ref !== null && ref !== '') {
    const parsed = parseInt(ref, 10);
    if (!isNaN(parsed)) {
      access_level = parsed;
    }
  }

  const user = await models.createUser({
    name,
    email,
    username,
    password_hash,
    verification_token: token,
    verification_token_expires_at: expiresAt,
    access_level
  });

  console.log('[signupUser] User created with id:', user);

  // Send email verification (unless explicitly disabled)
  if (sendEmail) {
    try {
      const emailService = await emailServicePromise();
      await emailService.sendConfirmationEmail({ to: email, name, token });
      console.log('[signupUser] Verification email sent to:', email);
    } catch (emailError) {
      console.error('[signupUser] Failed to send verification email:', emailError);
      // Don't throw - user is still created, just log the error
    }
  }

  return {
    verification_token: token,
    email,
    username,
    name,
    access_level
  };
};

export const loginUser = async ({ identifier, password }) => {
  // Find user by email OR username
  const user = await models.findUserByEmailOrUsername(identifier);
  if (!user) throw new Error('Invalid email/username or password.');

  if (!user.is_verified) throw new Error('Please verify your email before logging in.');

  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) throw new Error('Invalid email/username or password.');

  const token = generateAuthToken({ 
    userId: user.id, 
    email: user.email, 
    username: user.username,
    access_level: user.access_level 
  });

  // Define ONLY the sensitive fields to exclude (these are auth-specific, not user model fields)
  const sensitiveFields = ['password_hash', 'reset_token', 'reset_token_expires_at', 'verification_token', 'verification_token_expires_at'];
  
  // Create safe user object by excluding only sensitive auth fields
  const safeUser = { ...user };
  sensitiveFields.forEach(field => delete safeUser[field]);
  
  return { 
    user: safeUser, 
    token 
  };
};

// Initiate password reset
export const initiatePasswordReset = async (email) => {
  const user = await models.findUserByEmail(email);
  if (!user) {
    // For security, do not reveal if the email is not registered.
    // Still return success to prevent email enumeration attacks.
    console.warn(`[PASSWORD_RESET] Attempt to reset password for non-existent email: ${email}`);
    return { success: true };
  }

  const { token, expiresAt } = generatePasswordResetToken({ userId: user.id });

  await models.storePasswordResetToken(user.id, token, expiresAt);

  return { email: user.email, name: user.name || 'User', token };
};

// Complete password reset
export const resetUserPassword = async (token, newPassword) => {
  const user = await models.findUserByPasswordResetToken(token);

  if (!user) {
    throw new Error('Invalid or expired password reset token.');
  }

  const newPasswordHash = await hashPassword(newPassword);
  await models.updatePasswordAndClearResetToken(user.id, newPasswordHash);

  return { userId: user.id, email: user.email };
};