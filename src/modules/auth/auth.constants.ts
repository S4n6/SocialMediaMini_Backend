/**
 * Dependency Injection Tokens for Clean Architecture Auth Module
 */

// Domain Repository Tokens
export const SESSION_REPOSITORY_TOKEN = 'SESSION_REPOSITORY';
export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY';

// Application Port Tokens (External Services)
export const TOKEN_REPOSITORY_TOKEN = 'TOKEN_REPOSITORY'; // ITokenService
export const PASSWORD_HASHER_TOKEN = 'PASSWORD_HASHER'; // IPasswordHasherService
export const EMAIL_SENDER_TOKEN = 'EMAIL_SENDER'; // IEmailService
export const TOKEN_GENERATOR_TOKEN = 'TOKEN_GENERATOR';

// Legacy Tokens (for backward compatibility)
export const LEGACY_AUTH_APPLICATION_SERVICE_TOKEN =
  'LEGACY_AUTH_APPLICATION_SERVICE';
export const LEGACY_TOKEN_GENERATOR_TOKEN = 'TOKEN_GENERATOR';
export const LEGACY_AUTHENTICATION_SERVICE_TOKEN = 'AUTHENTICATION_SERVICE';
export const LEGACY_REFRESH_TOKEN_PARSER_TOKEN = 'REFRESH_TOKEN_PARSER';
