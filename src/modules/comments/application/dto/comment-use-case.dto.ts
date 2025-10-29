/**
 * Use Case DTOs
 *
 * These DTOs are used internally by use cases and application services
 * for business logic orchestration. They should not be exposed to
 * the presentation layer directly.
 */

// ========== COMMAND DTOs ==========

export interface CreateCommentCommand {
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
}

export interface UpdateCommentCommand {
  commentId: string;
  userId: string;
  content: string;
}

export interface DeleteCommentCommand {
  commentId: string;
  userId: string;
}

export interface AddReactionCommand {
  commentId: string;
  userId: string;
  reactionType: string;
}

export interface RemoveReactionCommand {
  commentId: string;
  userId: string;
  reactionType: string;
}

// ========== QUERY DTOs ==========

export interface GetCommentByIdQuery {
  commentId: string;
  userId?: string;
}

export interface GetCommentsByPostQuery {
  postId: string;
  page: number;
  limit: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
  userId?: string;
}

export interface GetRepliesQuery {
  commentId: string;
  page: number;
  limit: number;
  userId?: string;
}

export interface GetCommentsByAuthorQuery {
  authorId: string;
  page: number;
  limit: number;
  userId?: string;
}

// ========== RESULT DTOs ==========

export interface CommentUseCaseResult {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
  isReply: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedCommentsResult {
  items: CommentUseCaseResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommentWithRepliesResult {
  comment: CommentUseCaseResult;
  replies: PaginatedCommentsResult;
}

export interface ReactionToggleResult {
  commentId: string;
  reactionType: string;
  added: boolean;
  newCount: number;
}
