/**
 * E2E Test Setup
 * Configures environment for E2E testing
 */

// Load environment variables from .env file
require('dotenv').config();

// Use test database if available, fallback to main DATABASE_URL
const databaseUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL or DATABASE_URL_TEST must be set!');
  console.error('💡 Add DATABASE_URL_TEST to your .env file:');
  console.error(
    '   DATABASE_URL_TEST="postgresql://user:password@localhost:5432/social_media_test"',
  );
  process.exit(1);
}

// Only validate URL format, don't override if it's valid
if (
  !databaseUrl.startsWith('postgresql://') &&
  !databaseUrl.startsWith('postgres://')
) {
  console.error(
    '❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://',
  );
  console.error('   Current value:', databaseUrl);
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Increase timeout for E2E tests (they're slower than unit tests)
jest.setTimeout(30000); // 30 seconds

console.log('🧪 E2E Test Environment Configured');
console.log('📦 Database:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
