// models/migrations/mysql/0000-migrations-table.js


export const up = async (db) => {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL,
      batch INT NOT NULL,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_migration (migration_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

export const down = async (db) => {
  await db.raw(`DROP TABLE IF EXISTS migrations`);
};