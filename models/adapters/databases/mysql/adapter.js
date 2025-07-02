import mysql from 'mysql2/promise';
import { DatabaseAdapter } from '../database-adapter.js';

export default class MySQLAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      authPlugins: {
        mysql_clear_password: () => () => Buffer.from(config.password + '\0'),
      },
      waitForConnections: true,
      connectionLimit: config.poolLimit || 10,
      queueLimit: 0
    });
  }

  async connect() {
    await this.pool.query('SELECT 1');
  }

  async disconnect() {
    await this.pool.end();
  }

  async query(sql, params) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  async beginTransaction() {
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
  }

  async commit() {
    await this.connection.commit();
    this.connection.release();
  }

  async rollback() {
    await this.connection.rollback();
    this.connection.release();
  }
}
