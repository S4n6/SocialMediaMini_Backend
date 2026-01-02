/**
 * Domain Layer Barrel Exports
 *
 * This file provides a single entry point for all domain layer components,
 * making imports cleaner and maintaining proper encapsulation.
 */

// ========== ENTITIES ==========
export * from './entities/comment.entity';

// ========== REPOSITORIES (Interfaces) ==========
export * from './repositories/comment.repository';

// ========== DOMAIN SERVICES ==========
export * from './services/comment-domain.service';

// ========== EVENTS ==========
export * from './events/comment.events';

// ========== EXCEPTIONS ==========
export * from './exceptions/comment.exceptions';

// ========== FACTORIES ==========
export * from './factories/comment.factory';

// ========== DOMAIN INTERFACES (PORTS) ==========
export * from './interfaces/domain-ports.interface';

// ========== TYPE RE-EXPORTS ==========
// Re-export commonly used types from entities
export type { CommentProps, ReactionType } from './entities/comment.entity';

// Re-export domain port interfaces
export type {
  IUserDomainPort,
  IPostDomainPort,
  INotificationDomainPort,
} from './interfaces/domain-ports.interface';
