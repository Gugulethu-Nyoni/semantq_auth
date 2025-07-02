// src/adapters/databases/mongodb/adapter.js
import { MongoClient } from 'mongodb';
import { DatabaseAdapter } from '../database-adapter.js';

export default class MongoDBAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.client = new MongoClient(config.uri);
    this.db = null;
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db();
    return this.db;
  }

  async disconnect() {
    return this.client.close();
  }

  async query(collection, operation, ...args) {
    if (!this.db) await this.connect();
    return this.db.collection(collection)[operation](...args);
  }

  // MongoDB has native transactions but we'll keep simple for now
  async beginTransaction() {
    this.session = this.client.startSession();
    this.session.startTransaction();
  }

  async commit() {
    await this.session.commitTransaction();
    this.session.endSession();
  }

  async rollback() {
    await this.session.abortTransaction();
    this.session.endSession();
  }
}