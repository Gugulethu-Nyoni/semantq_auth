// semantq_auth/models/mysql/user.js
import mysqlAdapter from '../../../../../models/adapters/mysql.js';

// Find user by email
export const findUserByEmail = async (email) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

// NEW: Find user by username
export const findUserByUsername = async (username) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows[0];
};

// NEW: Find user by email OR username (for login)
export const findUserByEmailOrUsername = async (identifier) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [identifier, identifier]
  );
  return rows[0];
};

export const createUser = async (user) => {
  // Use provided access_level or default to 1
  const accessLevel = user.ref ?? 1;

  const [result] = await mysqlAdapter.query(
    `INSERT INTO users (name, email, username, password_hash, verification_token, verification_token_expires_at, access_level)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.name ?? null,
      user.email ?? null,
      user.username ?? null, // NEW: Add username
      user.password_hash ?? null,
      user.verification_token ?? null,
      user.verification_token_expires_at ?? null,
      accessLevel
    ]
  );

  return result.insertId;
};

// Find user by verification token
export const findUserByVerificationToken = async (token) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT * FROM users WHERE verification_token = ?',
    [token]
  );
  return rows[0];
};

// Mark user as verified by ID
export const verifyUserById = async (userId) => {
  await mysqlAdapter.query(
    `UPDATE users
     SET is_verified = 1,
         verification_token = NULL,
         verification_token_expires_at = NULL
     WHERE id = ?`,
    [userId]
  );
};

// Find user by ID - MODIFIED to include role
// Find user by ID - MODIFIED to include access_level
export const findUserById = async (id) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT id, email, username, name, access_level FROM users WHERE id = ?', // ADDED: username
    [id]
  );
  return rows[0];
};

// Store password reset token
export const storePasswordResetToken = async (userId, token, expiresAt) => {
  await mysqlAdapter.query(
    `UPDATE users
     SET reset_token = ?,
         reset_token_expires_at = ?
     WHERE id = ?`,
    [token, expiresAt, userId]
  );
};

// Find user by password reset token (and not expired)
export const findUserByPasswordResetToken = async (token) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > ?',
    [token, new Date()] // Pass current JS time instead of SQL NOW()
  );
  return rows[0];
};

// Update password and clear reset token
export const updatePasswordAndClearResetToken = async (userId, newPasswordHash) => {
  await mysqlAdapter.query(
    `UPDATE users
     SET password_hash = ?,
         reset_token = NULL,
         reset_token_expires_at = NULL
     WHERE id = ?`,
    [newPasswordHash, userId]
  );
};

/**
 * Updates the last_login_at timestamp for a user
 * @param {number} userId 
 */
export const updateLastLogin = async (userId) => {
  await mysqlAdapter.query(
    `UPDATE users 
     SET last_login_at = CURRENT_TIMESTAMP(3) 
     WHERE id = ?`,
    [userId]
  );
};