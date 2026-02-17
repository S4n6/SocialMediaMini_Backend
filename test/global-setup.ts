/**
 * Jest Global Setup for E2E Tests
 *
 * Creates isolated PostgreSQL schemas for each test worker to enable
 * parallel test execution without data collisions.
 *
 * Each worker gets its own schema: test_worker_1, test_worker_2, etc.
 * The migration SQL is applied to each schema independently.
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config();

/**
 * Number of worker schemas to create.
 * IMPORTANT: This must match "maxWorkers" in jest-e2e.json (default: 4)
 * Override via E2E_MAX_WORKERS environment variable if needed.
 */
const MAX_WORKERS = Number(process.env.E2E_MAX_WORKERS) || 4;

/** Prefix for all test schemas */
export const TEST_SCHEMA_PREFIX = 'test_worker_';

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL_TEST;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL_TEST must be set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Read migration SQL
    const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
    const migrationFolders = fs
      .readdirSync(migrationsDir)
      .filter((f) => !f.endsWith('.toml'))
      .sort();

    const migrationSQLs = migrationFolders.map((folder) =>
      fs.readFileSync(
        path.join(migrationsDir, folder, 'migration.sql'),
        'utf-8',
      ),
    );

    console.log(`\n🔧 Setting up ${MAX_WORKERS} isolated test schemas...`);

    for (let i = 1; i <= MAX_WORKERS; i++) {
      const schemaName = `${TEST_SCHEMA_PREFIX}${i}`;

      // Drop and recreate schema for a clean slate
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await client.query(`CREATE SCHEMA "${schemaName}"`);

      // Apply all migrations within this schema
      for (const sql of migrationSQLs) {
        await client.query(`SET search_path TO "${schemaName}"`);
        await client.query(sql);
      }

      console.log(`  ✅ Schema "${schemaName}" ready`);
    }

    // Store the database URL for workers to use
    process.env.__TEST_DATABASE_URL = databaseUrl;

    console.log('🚀 All test schemas ready for parallel execution\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}
