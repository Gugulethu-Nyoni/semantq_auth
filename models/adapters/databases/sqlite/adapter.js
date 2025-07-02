// src/adapters/databases/sqlite/adapter.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { DatabaseAdapter } from '../database-adapter.js';

export default class SQLiteAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.dbPromise = open({
      filename: config.path || './data/sqlite.db',
      driver: sqlite3.Database
    });
  }

  async connect() {
    this.db = await this.dbPromise;
    return this.db;
  }

  async disconnect() {
    const db = await this.dbPromise;
    return db.close();
  }

  async query(sql, params) {
    const db = await this.dbPromise;
    return db.all(sql, params);
  }

  async beginTransaction() {
    const db = await this.dbPromise;
    await db.run('BEGIN TRANSACTION');
  }

  async commit() {
    const db = await this.dbPromise;
    await db.run('COMMIT');
  }

  async rollback() {
    const db = await this.dbPromise;
    await db.run('ROLLBACK');
  }
}