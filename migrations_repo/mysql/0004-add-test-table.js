export const up = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_field VARCHAR(100) NOT NULL
    )
  `);
};

export const down = async (pool) => {
  await pool.query(`DROP TABLE IF EXISTS test_table`);
};
