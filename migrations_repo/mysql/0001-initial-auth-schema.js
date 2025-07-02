export const up = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      surname VARCHAR(100),      
      is_verified BOOLEAN DEFAULT FALSE,
      verification_token VARCHAR(255),
      verification_token_expires_at DATETIME,
      reset_token VARCHAR(255),
      reset_token_expires_at DATETIME,
      last_login_at DATETIME,
      failed_login_attempts INT DEFAULT 0,
      status ENUM('active', 'locked', 'suspended') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_verification_token (verification_token),
      INDEX idx_reset_token (reset_token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action ENUM(
        'register', 
        'login', 
        'login_failed',
        'logout', 
        'password_reset',
        'email_verified',
        'account_locked'
      ) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;
  `);
};

export const down = async (pool) => {
  // Drop dependent tables first
  await pool.query(`DROP TABLE IF EXISTS sessions`);
  await pool.query(`DROP TABLE IF EXISTS auth_logs`);
  await pool.query(`DROP TABLE IF EXISTS products`);
  // Then drop referenced tables
  await pool.query(`DROP TABLE IF EXISTS users`);
};
