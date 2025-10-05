/**
 * Dependency Injection Tokens for Clean Architecture Auth Module
 */

// Repository Interface Tokens
export const SESSION_REPOSITORY_TOKEN = 'SESSION_REPOSITORY';
export const TOKEN_REPOSITORY_TOKEN = 'TOKEN_REPOSITORY';

// Domain Service Interface Tokens
export const PASSWORD_HASHER_TOKEN = 'PASSWORD_HASHER';
export const TOKEN_GENERATOR_TOKEN = 'TOKEN_GENERATOR';
export const EMAIL_SENDER_TOKEN = 'EMAIL_SENDER';

// Legacy Tokens (for backward compatibility)
export const LEGACY_AUTH_APPLICATION_SERVICE_TOKEN =
  'LEGACY_AUTH_APPLICATION_SERVICE';
export const LEGACY_TOKEN_GENERATOR_TOKEN = 'TOKEN_GENERATOR';
export const LEGACY_AUTHENTICATION_SERVICE_TOKEN = 'AUTHENTICATION_SERVICE';
export const LEGACY_REFRESH_TOKEN_PARSER_TOKEN = 'REFRESH_TOKEN_PARSER';
