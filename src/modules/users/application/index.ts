/**
 * Users Module - Application Layer
 *
 * This module handles user identity, authentication, and profile management.
 *
 * Responsibilities:
 * - User registration and authentication
 * - Profile management (update, verification)
 * - User search and retrieval
 * - Read-only follow counts (followersCount, followingCount)
 *
 * NOT Responsible For:
 * - Follow/unfollow operations (handled by Follow module)
 * - Followers/following queries (handled by Follow module)
 * - Post management (handled by Posts module)
 */

// DTOs
export * from './dto/user.dto';
export * from './dto/application.dto';

// Use Cases
export * from './use-cases/create-user.use-case';
export * from './use-cases/update-profile.use-case';
export * from './use-cases/verify-email.use-case';
export * from './use-cases/get-user.use-case';
export * from './use-cases/auth-integration.use-case';
export * from './use-cases/user-management.use-case';

// Event Handlers
// export * from './events/user-event.handlers'; // Temporarily disabled for clean architecture refactor

// Application Service
export * from './user-application.service';
