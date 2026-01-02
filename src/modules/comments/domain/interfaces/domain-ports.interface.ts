/**
 * Domain Interfaces for External Dependencies
 *
 * These interfaces define contracts that the domain layer needs from external services.
 * They belong to the domain layer and will be implemented by infrastructure adapters.
 * This follows the Dependency Inversion Principle - domain defines what it needs,
 * infrastructure provides implementations.
 */

// ========== USER DOMAIN INTERFACE ==========

/**
 * Domain interface for user-related operations needed by comment domain.
 * This interface is owned by the domain layer and must be implemented
 * by infrastructure adapters.
 */
export interface IUserDomainPort {
  /**
   * Check if a user exists in the system
   * @param userId - The ID of the user to check
   * @returns Promise<boolean> - true if user exists, false otherwise
   */
  exists(userId: string): Promise<boolean>;

  /**
   * Check if a user has admin privileges
   * @param userId - The ID of the user to check
   * @returns Promise<boolean> - true if user is admin, false otherwise
   */
  isAdmin(userId: string): Promise<boolean>;
}

// ========== POST DOMAIN INTERFACE ==========

/**
 * Domain interface for post-related operations needed by comment domain.
 * This interface is owned by the domain layer and must be implemented
 * by infrastructure adapters.
 */
export interface IPostDomainPort {
  /**
   * Check if a post exists in the system
   * @param postId - The ID of the post to check
   * @returns Promise<boolean> - true if post exists, false otherwise
   */
  exists(postId: string): Promise<boolean>;

  /**
   * Check if a post allows comments
   * @param postId - The ID of the post to check
   * @returns Promise<boolean> - true if commenting is allowed, false otherwise
   */
  allowsComments(postId: string): Promise<boolean>;
}

// ========== NOTIFICATION DOMAIN INTERFACE ==========

/**
 * Domain interface for notification operations (optional for future extension)
 * This allows the domain to trigger notifications without knowing how they're sent.
 */
export interface INotificationDomainPort {
  /**
   * Send notification when a comment is created
   * @param commentId - The ID of the comment
   * @param postAuthorId - The ID of the post author to notify
   * @param commentAuthorId - The ID of the comment author
   */
  notifyCommentCreated(
    commentId: string,
    postAuthorId: string,
    commentAuthorId: string,
  ): Promise<void>;

  /**
   * Send notification when a reply is created
   * @param replyId - The ID of the reply
   * @param parentCommentAuthorId - The ID of the parent comment author to notify
   * @param replyAuthorId - The ID of the reply author
   */
  notifyReplyCreated(
    replyId: string,
    parentCommentAuthorId: string,
    replyAuthorId: string,
  ): Promise<void>;
}

// ========== TYPE GUARDS ==========

/**
 * Type guard to check if an object implements IUserDomainPort
 */
export function isUserDomainPort(obj: any): obj is IUserDomainPort {
  return (
    obj && typeof obj.exists === 'function' && typeof obj.isAdmin === 'function'
  );
}

/**
 * Type guard to check if an object implements IPostDomainPort
 */
export function isPostDomainPort(obj: any): obj is IPostDomainPort {
  return (
    obj &&
    typeof obj.exists === 'function' &&
    typeof obj.allowsComments === 'function'
  );
}
