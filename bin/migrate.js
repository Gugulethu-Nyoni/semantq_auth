#!/usr/bin/env node

// Load environment variables
// import '../config/env-loader.js';

import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fs from 'fs/promises';

import databaseConfig from '../config/databases.js';
import config from '../config/authentique.config.js';

// MySQL adapter factory
import { getDatabaseAdapter } from '../src/adapters/databases/database-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  success: chalk.greenBright,
  info: chalk.cyanBright,
  error: chalk.redBright,
  highlight: chalk.magentaBright
};

// Parse command line args
const args = process.argv.slice(2);
const command = args[0] || 'run';
const rollbackSteps = args[1] ? Number(args[1]) : 1;

const mysqlConfig = databaseConfig.mysql;

console.log(colors.info(`Active DB adapter: ${config.database.adapter}`));

// --- MYSQL MIGRATION HANDLERS ---

async function runMysqlMigrations() {
  let db;
  try {
    console.log(colors.info(`🏁 Starting ${colors.highlight('MySQL')} migrations`));

    db = await getDatabaseAdapter('mysql', mysqlConfig);
    await db.connect();
    console.log(colors.info('DB Adapter instance:'), db);

    const pool = db.pool;

    // Ensure migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, '..', 'src', 'adapters', 'databases', 'mysql', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files.filter(f => /^\d+.*\.js$/.test(f)).sort();

    if (migrationFiles.length === 0) {
      console.log(colors.info('ℹ️ No migration files found.'));
      return;
    }

    const [appliedRows] = await pool.query('SELECT name FROM migrations');
    const appliedMigrations = new Set(appliedRows.map(row => row.name));

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(colors.info(`⏭️ Skipping already applied migration: ${file}`));
        continue;
      }

      const migrationPath = path.join(migrationsDir, file);
      console.log(colors.info(`➡️ Running migration: ${file}`));

      const migration = await import(migrationPath);

      if (typeof migration.up !== 'function') {
        console.warn(colors.error(`⚠️ Migration file ${file} does not export an 'up' function. Skipping.`));
        continue;
      }

      await migration.up(pool);

      await pool.query('INSERT INTO migrations (name) VALUES (?)', [file]);

      console.log(colors.success(`✅ Migration completed: ${file}`));
    }

    console.log(colors.success('🎉 All MySQL migrations executed successfully.'));
  } catch (err) {
    console.log(colors.error(`💥 Migration error: ${err.message}`));
    process.exit(1);
  } finally {
    if (db) await db.disconnect();
  }
}

async function rollbackMysqlMigrations(steps) {
  let db;
  try {
    console.log(colors.info(`🏁 Rolling back ${steps} MySQL migration(s)`));

    db = await getDatabaseAdapter('mysql', mysqlConfig);
    await db.connect();
    console.log(colors.info('DB Adapter instance:'), db);

    const pool = db.pool;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [appliedRows] = await pool.query('SELECT name FROM migrations ORDER BY run_on DESC');
    if (appliedRows.length === 0) {
      console.log(colors.info('ℹ️ No migrations have been applied.'));
      return;
    }

    const toRollback = appliedRows.slice(0, steps);

    const migrationsDir = path.join(__dirname, '..', 'src', 'adapters', 'databases', 'mysql', 'migrations');

    for (const row of toRollback) {
      const migrationPath = path.join(migrationsDir, row.name);
      console.log(colors.info(`↩️ Rolling back migration: ${row.name}`));

      const migration = await import(migrationPath);

      if (typeof migration.down !== 'function') {
        console.warn(colors.error(`⚠️ Migration file ${row.name} does not export a 'down' function. Skipping rollback.`));
        continue;
      }

      await migration.down(pool);

      await pool.query('DELETE FROM migrations WHERE name = ?', [row.name]);

      console.log(colors.success(`✅ Rollback completed: ${row.name}`));
    }

    console.log(colors.success(`🎉 Rolled back ${toRollback.length} migration(s) successfully.`));
  } catch (err) {
    console.log(colors.error(`💥 Rollback error: ${err.message}`));
    process.exit(1);
  } finally {
    if (db) await db.disconnect();
  }
}

// --- MAIN ROUTER ---

if (config.database.adapter === 'mysql') {
  if (command === 'run') {
    await runMysqlMigrations();
  } else if (command === 'rollback') {
    await rollbackMysqlMigrations(rollbackSteps);
  } else {
    console.error(colors.error(`Unknown command: ${command}`));
    console.log(colors.info('Usage: authentique-migrate [run|rollback] [steps]'));
    process.exit(1);
  }
} else if (config.database.adapter === 'supabase') {
  console.log(colors.info(`✨ Supabase projects use the Supabase CLI for migrations.`));
  console.log(colors.info(`➡️ To run migrations:`));
  console.log(colors.info(`    supabase db push`));
  console.log(colors.info(`➡️ To reset the local database:`));
  console.log(colors.info(`    supabase db reset`));
  process.exit(0);
} else {
  console.error(colors.error(`Unsupported database adapter: ${config.database.adapter}`));
  process.exit(1);
}
