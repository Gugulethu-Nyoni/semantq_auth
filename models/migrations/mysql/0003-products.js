export const up = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      short_description VARCHAR(500),
      status ENUM('draft','active','archived','out_of_stock') DEFAULT 'draft',
      price DECIMAL(12,2) UNSIGNED,
      compare_price DECIMAL(12,2) UNSIGNED,
      cost_price DECIMAL(12,2) UNSIGNED,
      stock_quantity INT UNSIGNED DEFAULT 0,
      weight DECIMAL(10,2) UNSIGNED,
      length DECIMAL(10,2) UNSIGNED,
      width DECIMAL(10,2) UNSIGNED,
      height DECIMAL(10,2) UNSIGNED,
      attributes JSON,
      metadata JSON,
      seo_title VARCHAR(255),
      seo_description VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_price (price),
      INDEX idx_stock (stock_quantity),
      FULLTEXT INDEX ft_search (name, description, short_description)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Add stock alert trigger
  await pool.query(`
    CREATE TRIGGER IF NOT EXISTS product_stock_alert
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
      IF NEW.stock_quantity < 5 AND OLD.stock_quantity >= 5 THEN
        INSERT INTO notifications (type, entity_type, entity_id, message)
        VALUES ('low_stock', 'product', NEW.id, 
                CONCAT('Low stock alert for product ', NEW.name));
      END IF;
    END;
  `);
};

export const down = async (pool) => {
  await pool.query(`DROP TRIGGER IF EXISTS product_stock_alert`);
  await pool.query(`DROP TABLE IF EXISTS products`);
};