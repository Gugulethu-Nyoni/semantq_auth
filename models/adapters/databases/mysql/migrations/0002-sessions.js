export const up = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(512) NOT NULL,  -- Increased length for modern tokens
      device_info VARCHAR(255),
      ip_address VARCHAR(45),
      is_revoked BOOLEAN DEFAULT FALSE,
      revoked_at TIMESTAMP NULL,
      expires_at TIMESTAMP NOT NULL,  -- Explicit expiration
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_token (token(64)),  -- Prefix index for token
      INDEX idx_expires (expires_at),
      INDEX idx_active_sessions (user_id, is_revoked, expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
  // Add session cleanup procedure for MySQL
  await pool.query(`
    CREATE EVENT IF NOT EXISTS session_cleanup
    ON SCHEDULE EVERY 1 DAY
    DO
      DELETE FROM sessions 
      WHERE is_revoked = TRUE OR expires_at < NOW();
  `);
};

export const down = async (pool) => {
  await pool.query(`DROP EVENT IF EXISTS session_cleanup`);
  await pool.query(`DROP TABLE IF EXISTS sessions`);
};