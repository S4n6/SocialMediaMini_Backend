import { CommentEntity } from '../comment.entity';

export interface CommentRepository {
  /**
   * Save a comment entity
   */
  save(comment: CommentEntity): Promise<CommentEntity>;

  /**
   * Find comment by ID
   */
  findById(id: string): Promise<CommentEntity | null>;

  /**
   * Update a comment entity
   */
  update(comment: CommentEntity): Promise<CommentEntity>;

  /**
   * Find comments by post ID with pagination
   */
  findByPostId(
    postId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Find replies for a specific comment
   */
  findRepliesByCommentId(
    commentId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Find comments by author ID
   */
  findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Delete comment by ID
   */
  deleteById(id: string): Promise<void>;

  /**
   * Check if comment exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count comments for a specific post
   */
  countByPostId(postId: string): Promise<number>;

  /**
   * Count replies for a specific comment
   */
  countRepliesByCommentId(commentId: string): Promise<number>;

  /**
   * Get comment depth in thread
   */
  getCommentDepth(commentId: string): Promise<number>;

  /**
   * Find top-level comments (no parent) for a post
   */
  findTopLevelCommentsByPostId(
    postId: string,
    page: number,
    limit: number,
    sortBy?: 'newest' | 'oldest' | 'popular',
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Find all comments in a thread (including nested replies)
   */
  findCommentThread(rootCommentId: string): Promise<CommentEntity[]>;

  /**
   * Soft delete comment (mark as deleted but keep for replies)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Check if user has already reacted to comment
   */
  hasUserReacted(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<boolean>;

  /**
   * Add reaction to comment
   */
  addReaction(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<void>;

  /**
   * Remove reaction from comment
   */
  removeReaction(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<void>;

  /**
   * Get comment reaction counts
   */
  getReactionCounts(commentId: string): Promise<Record<string, number>>;

  /**
   * Bulk delete comments by post ID
   */
  deleteByPostId(postId: string): Promise<void>;
}
