import { getMySQLAdapter } from '../../adapters/databases/mysql/index.js';

const db = getMySQLAdapter();

// Existing: find by email
export const findUserByEmail = async (email) => {
  const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

// Existing: create new user
export const createUser = async (user) => {
  const result = await db.query(
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

// ✅ New: find user by verification token
export const findUserByVerificationToken = async (token) => {
  const rows = await db.query(
    'SELECT * FROM users WHERE verification_token = ?',
    [token]
  );
  return rows[0];
};

// ✅ New: mark user as verified by ID
export const verifyUserById = async (userId) => {
  await db.query(
    `UPDATE users
     SET is_verified = 1,
         verification_token = NULL,
         verification_token_expires_at = NULL
     WHERE id = ?`,
    [userId]
  );
};



export const findUserById = async (id) => {
    // Ensure this uses the 'db' instance you've initialized
    const rows = await db.query('SELECT id, email, name FROM users WHERE id = ?', [id]);
    return rows[0]; // Returns the first row (user) or undefined
};

// ✅ UPDATED: Store password reset token (using schema names)
export const storePasswordResetToken = async (userId, token, expiresAt) => {
    await db.query(
        `UPDATE users
         SET reset_token = ?,
             reset_token_expires_at = ?
         WHERE id = ?`,
        [token, expiresAt, userId]
    );
};

// ✅ UPDATED: Find user by password reset token (using schema names)
export const findUserByPasswordResetToken = async (token) => {
    const rows = await db.query(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()',
        [token]
    );
    return rows[0];
};

// ✅ UPDATED: Update user password and clear reset token (using schema names)
export const updatePasswordAndClearResetToken = async (userId, newPasswordHash) => {
    await db.query(
        `UPDATE users
         SET password_hash = ?,
             reset_token = NULL,
             reset_token_expires_at = NULL
         WHERE id = ?`,
        [newPasswordHash, userId]
    );
};