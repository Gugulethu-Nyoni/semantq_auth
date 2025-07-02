// src/services/auth/strategies/jwt.js
import jwt from 'jsonwebtoken';
import config from '../../../../config/auth.js';

// Define default expiry times if not specified in config
const JWT_SECRET = config.jwtSecret;
const TOKEN_EXPIRY_AUTH = config.tokenExpiryAuth || '1h'; // Default to 1 hour for auth token
const TOKEN_EXPIRY_VERIFICATION = config.tokenExpiryVerification || '24h'; // Default to 24 hours for verification
const TOKEN_EXPIRY_PASSWORD_RESET = config.tokenExpiryPasswordReset || '1h'; // Default to 1 hour for password reset

export const generateAuthToken = (payload) => {
  console.log('[generateAuthToken] Signing payload:', payload);
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY_AUTH, // Use configurable expiry
    issuer: 'authentique',
    audience: 'ui-server'
  });
};

export const generateVerificationToken = (payload) => {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY_VERIFICATION, // Use configurable expiry
    issuer: 'authentique',
    audience: 'email-verification' // Specific audience for verification tokens
  });

  // Calculate exact expiry time for database storage based on the token's 'exp' claim
  const decoded = jwt.decode(token);
  const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
  return { token, expiresAt };
};

/**
 * Generates a JWT for password reset.
 * @param {Object} payload - The data to include in the token (e.g., { userId: '...' }).
 * @returns {Object} An object containing the token string and its expiry date.
 */
export const generatePasswordResetToken = (payload) => {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY_PASSWORD_RESET, // Use configurable expiry
    issuer: 'authentique',
    audience: 'password-reset' // Specific audience for password reset tokens
  });

  // Calculate exact expiry time for database storage
  const decoded = jwt.decode(token);
  const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;
  return { token, expiresAt };
};