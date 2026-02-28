/**
 * Domain Layer Barrel Exports
 */

// ========== ENTITIES ==========
export * from './entities/comment.entity';

// ========== REPOSITORY INTERFACE ==========
export * from './repositories/i-comment.repository';

// ========== DOMAIN SERVICES ==========
export * from './services/comment-domain.service';

// ========== EVENTS ==========
export * from './events/comment.events';

// ========== EXCEPTIONS ==========
export * from './exceptions/comment.exceptions';

// ========== FACTORIES ==========
export * from './factories/comment.factory';

// ========== DOMAIN PORTS ==========
export * from './interfaces/domain-ports.interface';

// ========== TYPE RE-EXPORTS ==========
export type { CommentProps } from './entities/comment.entity';
export type { ReactionType } from './entities/comment.entity';
export type {
  PaginatedResult,
  ICommentRepository,
} from './repositories/i-comment.repository';
export type {
  IUserDomainPort,
  IPostDomainPort,
  INotificationDomainPort,
} from './interfaces/domain-ports.interface';
