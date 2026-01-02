/**
 * Application Layer Barrel Exports
 *
 * This file provides a single entry point for all application layer components,
 * including use cases, services, and DTOs used for business orchestration.
 */

// ========== USE CASES ==========
export * from './use-cases/create-comment.use-case';
export * from './use-cases/get-comment-by-id.use-case';
export * from './use-cases/get-comments-by-post.use-case';
export * from './use-cases/update-comment.use-case';
export * from './use-cases/delete-comment.use-case';
export * from './use-cases/add-reaction.use-case';
export * from './use-cases/remove-reaction.use-case';
export * from './use-cases/get-replies.use-case';

// ========== APPLICATION SERVICES ==========
export * from './services/comment-application.service';

// ========== INTERFACES ==========
export * from './interfaces/comment-application.interface';

// ========== DTOs ==========
export * from './dto/comment.dto';
// Note: Use case DTOs are exported via their respective use cases

// ========== TYPE RE-EXPORTS ==========
// Re-export commonly used interfaces
export type {
  CommentApplicationService,
  CommentMapper,
} from './interfaces/comment-application.interface';
