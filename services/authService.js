// semantq_auth/services/authService.js
import models from '../models/index.js';
import { hashPassword, comparePassword } from './password.js';
import { generateVerificationToken, generateAuthToken, generatePasswordResetToken } from './strategies/jwt.js';

export const signupUser = async ({ name, email, password, ref }) => {
  console.log('[signupUser] Starting signup for:', email);

  const existingUser = await models.findUserByEmail(email);
  if (existingUser) {
    console.log('[signupUser] Email already registered:', email);
    throw new Error('Email is already registered.');
  }

  const password_hash = await hashPassword(password);
  console.log('[signupUser] Password hashed');

  const { token, expiresAt } = generateVerificationToken({ email });
  console.log('[signupUser] Generated token:', token, 'Expires at:', expiresAt);

  // Convert ref to access_level, fallback to 1 if ref is not a valid number
  let access_level = 1;
  if (ref !== undefined && ref !== null) {
    const parsed = parseInt(ref, 10);
    if (!isNaN(parsed)) {
      access_level = parsed;
    }
  }

  const user = await models.createUser({
    name,
    email,
    password_hash,
    verification_token: token,
    verification_token_expires_at: expiresAt,
    access_level
  });

  console.log('[signupUser] User created with id:', user);

  return {
    verification_token: token,
    email,
    name,
    access_level
  };
};




export const loginUser = async ({ email, password }) => {
  const user = await models.findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  if (!user.is_verified) throw new Error('Please verify your email before logging in.');

  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) throw new Error('Invalid email or password.');

  // MODIFIED: Include user's access_level in the JWT payload
  const token = generateAuthToken({ userId: user.id, email: user.email, access_level: user.access_level });

  return { user: { id: user.id, email: user.email, name: user.name, access_level: user.access_level }, token }; // Return access_level
};


// ✅ NEW: Initiate password reset
export const initiatePasswordReset = async (email) => {
  // FIX: Call findUserByEmail directly on the 'models' object
  const user = await models.findUserByEmail(email);
  if (!user) {
    // For security, do not reveal if the email is not registered.
    // Still return success to prevent email enumeration attacks.
    console.warn(`[PASSWORD_RESET] Attempt to reset password for non-existent email: ${email}`);
    return { success: true };
  }

  const { token, expiresAt } = generatePasswordResetToken({ userId: user.id });

  // FIX: Call storePasswordResetToken directly on the 'models' object
  await models.storePasswordResetToken(user.id, token, expiresAt);

  return { email: user.email, name: user.name || 'User', token };
};

// ✅ NEW: Complete password reset
export const resetUserPassword = async (token, newPassword) => {
  // FIX: Call findUserByPasswordResetToken directly on the 'models' object
  const user = await models.findUserByPasswordResetToken(token);

  if (!user) {
    throw new Error('Invalid or expired password reset token.');
  }

  const newPasswordHash = await hashPassword(newPassword);
  // FIX: Call updatePasswordAndClearResetToken directly on the 'models' object
  await models.updatePasswordAndClearResetToken(user.id, newPasswordHash);

  return { userId: user.id, email: user.email };
};
