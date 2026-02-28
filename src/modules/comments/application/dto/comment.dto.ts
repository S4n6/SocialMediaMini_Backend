/**
 * Application-layer DTOs
 *
 * Plain interfaces used by use cases and application services.
 * NO framework decorators — validation is handled by presentation-layer DTOs.
 */

// ========== INPUT DTOs (from presentation → application) ==========

export interface CreateCommentDto {
  content: string;
  postId: string;
  parentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}

export interface AddCommentReactionDto {
  reactionType: string;
}

export interface GetCommentsDto {
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

export interface GetRepliesDto {
  page?: number;
  limit?: number;
}

// ========== OUTPUT DTOs (application → presentation) ==========

export interface CommentResponseDto {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
  isReply: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Optional populated data
  author?: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };

  reactions?: {
    [key: string]: number;
  };

  replyCount?: number;
  userReaction?: string | null;
}

export interface CommentWithRepliesDto extends CommentResponseDto {
  replies: {
    items: CommentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CommentPaginationDto {
  items: CommentResponseDto[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ReactionToggleResponseDto {
  commentId: string;
  reactionType: string;
  added: boolean;
  newCount: number;
}
