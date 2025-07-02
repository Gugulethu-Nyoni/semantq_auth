import {
    findUserByEmail,
    createUser,
    findUserByVerificationToken,
    verifyUserById,             
    findUserById,               
    storePasswordResetToken,
    findUserByPasswordResetToken,
    updatePasswordAndClearResetToken
} from '../../models/user.js';

import { hashPassword } from '../password.js';
//import { generateVerificationToken } from './strategies/jwt.js';
//import { generateAuthToken } from './strategies/jwt.js';
import { generateVerificationToken, generateAuthToken, generatePasswordResetToken } from './strategies/jwt.js'; // Ensure generatePasswordResetToken is imported
import { comparePassword } from '../password.js';


export const signupUser = async ({ name, email, password }) => {
  console.log('[signupUser] Starting signup for:', email);

  // 1. Check if email already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    console.log('[signupUser] Email already registered:', email);
    throw new Error('Email is already registered.');
  }

  // 2. Hash the password
  const password_hash = await hashPassword(password);
  console.log('[signupUser] Password hashed');

  // 3. Generate verification token and expiry
  const { token, expiresAt } = generateVerificationToken({ email });
  console.log('[signupUser] Generated token:', token, 'Expires at:', expiresAt);

  // 4. Create user in DB
  const user = await createUser({
    name,
    email,
    password_hash,
    verification_token: token,
    verification_token_expires_at: expiresAt
  });
  console.log('[signupUser] User created with id:', user);

  // 5. Return relevant info (do NOT send email here)
  return {
    verification_token: token,
    email,
    name
  };
};


export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  if (!user.is_verified) throw new Error('Please verify your email before logging in.');

  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) throw new Error('Invalid email or password.');

  const token = generateAuthToken({ userId: user.id, email: user.email });

  return { user: { id: user.id, email: user.email, name: user.name }, token };
};


// ✅ NEW: Initiate password reset
export const initiatePasswordReset = async (email) => {
    const user = await findUserByEmail(email);
    if (!user) {
        // For security, do not reveal if the email is not registered.
        // Still return success to prevent email enumeration attacks.
        console.warn(`[PASSWORD_RESET] Attempt to reset password for non-existent email: ${email}`);
        return { success: true };
    }

    const { token, expiresAt } = generatePasswordResetToken({ userId: user.id });

    await storePasswordResetToken(user.id, token, expiresAt);

    return { email: user.email, name: user.name || 'User', token };
};

// ✅ NEW: Complete password reset
export const resetUserPassword = async (token, newPassword) => {
    const user = await findUserByPasswordResetToken(token);

    if (!user) {
        throw new Error('Invalid or expired password reset token.');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await updatePasswordAndClearResetToken(user.id, newPasswordHash);

    return { userId: user.id, email: user.email };
};
