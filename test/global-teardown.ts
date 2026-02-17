/**
 * Jest Global Teardown for E2E Tests
 *
 * Drops all test worker schemas after test execution completes.
 * IMPORTANT: MAX_WORKERS must match "maxWorkers" in jest-e2e.json
 */
import { Client } from 'pg';

require('dotenv').config();

const MAX_WORKERS = Number(process.env.E2E_MAX_WORKERS) || 4;
const TEST_SCHEMA_PREFIX = 'test_worker_';

export default async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL_TEST;

  if (!databaseUrl) return;

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    console.log('\n🧹 Cleaning up test schemas...');

    for (let i = 1; i <= MAX_WORKERS; i++) {
      const schemaName = `${TEST_SCHEMA_PREFIX}${i}`;
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      console.log(`  🗑️  Dropped "${schemaName}"`);
    }

    console.log('✨ Cleanup complete\n');
  } catch (error) {
    console.error('⚠️  Teardown warning:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  } finally {
    await client.end();
  }
}
