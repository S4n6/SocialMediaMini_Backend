/**
 * Response DTOs for Comment Controller
 *
 * These DTOs define the structure of HTTP responses sent to clients.
 * They should only contain data that's safe and appropriate for external consumption.
 */

// ========== COMMENT RESPONSE ==========

export interface CommentAuthorDto {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

export interface CommentReactionsDto {
  [key: string]: number;
}

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
  author?: CommentAuthorDto;
  reactions?: CommentReactionsDto;
  replyCount?: number;
  userReaction?: string | null;
}

// ========== PAGINATION RESPONSE ==========

export interface PaginationMetaDto {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CommentPaginationResponseDto {
  items: CommentResponseDto[];
  pagination: PaginationMetaDto;
}

// ========== COMMENT WITH REPLIES ==========

export interface CommentRepliesDto {
  items: CommentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CommentWithRepliesResponseDto extends CommentResponseDto {
  replies: CommentRepliesDto;
}

// ========== REACTION RESPONSE ==========

export interface ReactionToggleResponseDto {
  commentId: string;
  reactionType: string;
  added: boolean;
  newCount: number;
}

// ========== API RESPONSE WRAPPER ==========

export interface ApiSuccessResponse<T = any> {
  statusCode: number;
  message: string;
  success: true;
  data: T;
  timestamp?: Date;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  success: false;
  error?: string;
  details?: any;
  timestamp?: Date;
}
