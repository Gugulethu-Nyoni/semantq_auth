import postgresAdapter from '../../../../../models/adapters/postgresql.js';

// Find user by email
export const findUserByEmail = async (email) => {
  const [rows] = await postgresAdapter.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
};

// Find user by username
export const findUserByUsername = async (username) => {
  const [rows] = await postgresAdapter.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return rows[0];
};

// Find user by email OR username (for login)
export const findUserByEmailOrUsername = async (identifier) => {
  const [rows] = await postgresAdapter.query(
    'SELECT * FROM users WHERE email = $1 OR username = $2',
    [identifier, identifier]
  );
  return rows[0];
};

export const createUser = async (user) => {
  // Try access_level first (what service sends), fallback to ref (direct calls)
  let accessLevel = user.access_level ?? user.ref ?? 1;
  
  // Parse string to number (e.g., "60" → 60)
  if (typeof accessLevel === 'string') {
    accessLevel = parseInt(accessLevel, 10);
  }
  
  // Fallback if parsing failed
  if (isNaN(accessLevel)) {
    accessLevel = 1;
  }

  const [rows] = await postgresAdapter.query(
    `INSERT INTO users (name, email, username, password_hash, verification_token, verification_token_expires_at, access_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      user.name ?? null,
      user.email ?? null,
      user.username ?? null,
      user.password_hash ?? null,
      user.verification_token ?? null,
      user.verification_token_expires_at ?? null,
      accessLevel
    ]
  );

  return rows[0].id;
};




// Find user by verification token
export const findUserByVerificationToken = async (token) => {
  const [rows] = await postgresAdapter.query(
    'SELECT * FROM users WHERE verification_token = $1',
    [token]
  );
  return rows[0];
};

// Mark user as verified by ID
export const verifyUserById = async (userId) => {
  await postgresAdapter.query(
    `UPDATE users
     SET is_verified = TRUE,
         verification_token = NULL,
         verification_token_expires_at = NULL
     WHERE id = $1`,
    [userId]
  );
};

// Find user by ID
export const findUserById = async (id) => {
  const [rows] = await postgresAdapter.query(
    'SELECT id, email, username, name, access_level, "organizationId" FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

// Store password reset token
export const storePasswordResetToken = async (userId, token, expiresAt) => {
  await postgresAdapter.query(
    `UPDATE users
     SET reset_token = $1,
         reset_token_expires_at = $2
     WHERE id = $3`,
    [token, expiresAt, userId]
  );
};

// Find user by password reset token
export const findUserByPasswordResetToken = async (token) => {
  const [rows] = await postgresAdapter.query(
    'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > $2',
    [token, new Date()]
  );
  return rows[0];
};

// Update password and clear reset token
export const updatePasswordAndClearResetToken = async (userId, newPasswordHash) => {
  await postgresAdapter.query(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expires_at = NULL
     WHERE id = $2`,
    [newPasswordHash, userId]
  );
};