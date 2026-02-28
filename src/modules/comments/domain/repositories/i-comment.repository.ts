import { CommentEntity } from '../entities/comment.entity';

/**
 * Paginated query result.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Domain repository interface for Comment aggregate.
 *
 * Follows the repository pattern — `save()` performs a smart upsert
 * (INSERT or UPDATE). There is no standalone `update()` method;
 * mutations happen through entity business methods followed by `save()`.
 */
export interface ICommentRepository {
  // ========== CORE PERSISTENCE ==========

  /** Smart save — inserts a new comment or updates an existing one. */
  save(comment: CommentEntity): Promise<void>;

  /** Find a single comment by its ID. */
  findById(id: string): Promise<CommentEntity | null>;

  /** Hard-delete a comment by ID. */
  deleteById(id: string): Promise<void>;

  /** Check whether a comment exists. */
  exists(id: string): Promise<boolean>;

  // ========== QUERY METHODS ==========

  /** Top-level comments for a post (paginated, sorted). */
  findByPostId(
    postId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CommentEntity>>;

  /** Top-level comments with explicit sort option. */
  findTopLevelCommentsByPostId(
    postId: string,
    page: number,
    limit: number,
    sortBy?: 'newest' | 'oldest' | 'popular',
  ): Promise<PaginatedResult<CommentEntity>>;

  /** Direct replies to a given comment (paginated). */
  findRepliesByCommentId(
    commentId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CommentEntity>>;

  /** Comments authored by a specific user (paginated). */
  findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<CommentEntity>>;

  /** Entire thread starting from a root comment (recursive). */
  findCommentThread(rootCommentId: string): Promise<CommentEntity[]>;

  // ========== COUNTS & METADATA ==========

  /** Total comments on a post. */
  countByPostId(postId: string): Promise<number>;

  /** Direct reply count for a comment. */
  countRepliesByCommentId(commentId: string): Promise<number>;

  /** Nesting depth of a comment within its thread. */
  getCommentDepth(commentId: string): Promise<number>;

  // ========== SOFT DELETE ==========

  /** Soft-delete — preserves thread structure when a comment has replies. */
  softDelete(id: string): Promise<void>;

  /** Bulk-delete all comments under a post. */
  deleteByPostId(postId: string): Promise<void>;

  // ========== REACTIONS ==========

  hasUserReacted(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<boolean>;

  addReaction(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<void>;

  removeReaction(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<void>;

  getReactionCounts(commentId: string): Promise<Record<string, number>>;
}
