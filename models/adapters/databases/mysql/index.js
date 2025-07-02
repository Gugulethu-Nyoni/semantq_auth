// src/adapters/databases/mysql/index.js
import MySQLAdapter from './adapter.js';
import config from '../../../../config/databases.js';

let instance;

export function getMySQLAdapter() {
  if (!instance) {
    instance = new MySQLAdapter(config.mysql);
  }
  return instance;
}
