/**
 * E2E Test Setup (per-worker)
 *
 * Each Jest worker is assigned an isolated PostgreSQL schema
 * based on JEST_WORKER_ID to enable parallel execution.
 */

// Load environment variables from .env file
require('dotenv').config();

// Use test database
const databaseUrl = process.env.DATABASE_URL_TEST;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL_TEST must be set!');
  console.error('💡 Add DATABASE_URL_TEST to your .env file:');
  console.error(
    '   DATABASE_URL_TEST="postgresql://user:password@localhost:5432/social_media_test"',
  );
  process.exit(1);
}

if (
  !databaseUrl.startsWith('postgresql://') &&
  !databaseUrl.startsWith('postgres://')
) {
  console.error(
    '❌ ERROR: DATABASE_URL_TEST must start with postgresql:// or postgres://',
  );
  process.exit(1);
}

// Point DATABASE_URL to the test database
process.env.DATABASE_URL = databaseUrl;

// Assign isolated schema per worker
const workerId = process.env.JEST_WORKER_ID || '1';
const schemaName = `test_worker_${workerId}`;
process.env.DATABASE_SCHEMA = schemaName;

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Increase timeout for E2E tests
jest.setTimeout(60000);

console.log(`🧪 E2E Worker #${workerId} | Schema: ${schemaName}`);
console.log('📦 Database:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
