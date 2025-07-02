// src/adapters/databases/supabase/adapter.js
import { createClient } from '@supabase/supabase-js';
import { DatabaseAdapter } from '../database-adapter.js';

export default class SupabaseAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    // Use serviceRoleKey for server-side operations or anonKey for public
    this.client = createClient(config.url, config.serviceRoleKey || config.anonKey);
  }

  async connect() {
    // No explicit connection needed, but can test with a simple query
    try {
      await this.client.from('users').select('id').limit(1);
      return this.client;
    } catch (err) {
      throw new Error(`Supabase connection failed: ${err.message}`);
    }
  }

  async disconnect() {
    // Supabase client has no disconnect method
    return Promise.resolve();
  }

  /**
   * Generic query method:
   * Since Supabase uses a fluent query builder style, 
   * query method params must be adapted for your use.
   * 
   * For example, this simple implementation supports:
   *   query('users', 'select', ['id', 'email'], { eq: { is_verified: true } })
   * 
   * You might want to extend this or implement specific methods per your needs.
   */
  async query(table, operation, ...args) {
    const tableRef = this.client.from(table);

    switch (operation) {
      case 'select':
        // args[0] is columns array or string, optional filter in args[1]
        let query = tableRef.select(args[0] || '*');
        if (args[1]) {
          for (const [filterType, filterObj] of Object.entries(args[1])) {
            // e.g., filterType = 'eq', filterObj = { column: value }
            for (const [col, val] of Object.entries(filterObj)) {
              query = query[filterType](col, val);
            }
          }
        }
        return query;
      case 'insert':
        // args[0] is the object or array of objects to insert
        return tableRef.insert(args[0]);
      case 'update':
        // args[0] = updates, args[1] = filters (same as select)
        let updateQuery = tableRef.update(args[0]);
        if (args[1]) {
          for (const [filterType, filterObj] of Object.entries(args[1])) {
            for (const [col, val] of Object.entries(filterObj)) {
              updateQuery = updateQuery[filterType](col, val);
            }
          }
        }
        return updateQuery;
      case 'delete':
        // args[0] = filters
        let deleteQuery = tableRef.delete();
        if (args[0]) {
          for (const [filterType, filterObj] of Object.entries(args[0])) {
            for (const [col, val] of Object.entries(filterObj)) {
              deleteQuery = deleteQuery[filterType](col, val);
            }
          }
        }
        return deleteQuery;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  // Supabase currently doesn't have explicit transaction control like SQL
  // So these methods can throw or return no-op
  async beginTransaction() {
    throw new Error('Transactions are not supported in Supabase client.');
  }

  async commit() {
    throw new Error('Transactions are not supported in Supabase client.');
  }

  async rollback() {
    throw new Error('Transactions are not supported in Supabase client.');
  }
}
