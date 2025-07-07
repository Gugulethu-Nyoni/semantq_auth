// semantq_auth/models/mysql/user.js
// FIX: Corrected path to import the mysqlAdapter from the main semantq_server's models/adapters
import mysqlAdapter from '../../../../../models/adapters/mysql.js'; // This path goes up 4 levels to semantq_server/models/adapters/mysql.js

// Find user by email
export const findUserByEmail = async (email) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

// Create new user
export const createUser = async (user) => {
  const [result] = await mysqlAdapter.query(
    `INSERT INTO users (name, email, password_hash, verification_token, verification_token_expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      user.name || null,
      user.email || null,
      user.password_hash || null,
      user.verification_token || null,
      user.verification_token_expires_at || null
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

// Find user by ID
export const findUserById = async (id) => {
  const [rows] = await mysqlAdapter.query(
    'SELECT id, email, name FROM users WHERE id = ?',
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
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()',
    [token]
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
