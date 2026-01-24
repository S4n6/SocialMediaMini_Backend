/**
 * Users Module - Domain Layer
 *
 * Core domain entities and business rules for user identity and profile management.
 *
 * User Entity Methods (Follow-related - Read Only):
 * - isFollowing(userId): Check if user follows another user
 * - isFollowedBy(userId): Check if user is followed by another user
 * - followersCount: Get total followers count
 * - followingCount: Get total following count
 *
 * Note: Follow write operations (follow/unfollow) are handled by the Follow module.
 * The Users module only maintains read-only follow counts for profile display.
 */

// Domain entities
export * from './entities';

// Value objects
export * from './value-objects';

// Domain events
export * from './events';

// Domain exceptions
export * from './exceptions';

// Repository interfaces
export * from './repositories';

// Factories
export * from './factories';
