import { CommentEntity } from '../../domain/comment.entity';
import {
  CreateCommentDto,
  UpdateCommentDto,
  AddCommentReactionDto,
  GetCommentsDto,
  GetRepliesDto,
  CommentResponseDto,
  CommentWithRepliesDto,
  CommentPaginationDto,
  ReactionToggleResponseDto,
} from '../dto/comment.dto';

export interface CommentApplicationService {
  /**
   * Create a new comment
   */
  createComment(
    dto: CreateCommentDto,
    authorId: string,
  ): Promise<CommentResponseDto>;

  /**
   * Get comments for a specific post
   */
  getCommentsByPost(
    postId: string,
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<CommentPaginationDto>;

  /**
   * Get a specific comment with its replies
   */
  getCommentWithReplies(
    commentId: string,
    dto: GetRepliesDto,
    userId?: string,
  ): Promise<CommentWithRepliesDto>;

  /**
   * Get replies for a specific comment
   */
  getRepliesForComment(
    commentId: string,
    dto: GetRepliesDto,
    userId?: string,
  ): Promise<CommentPaginationDto>;

  /**
   * Get a single comment by ID
   */
  getCommentById(
    commentId: string,
    userId?: string,
  ): Promise<CommentResponseDto>;

  /**
   * Update a comment
   */
  updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto>;

  /**
   * Delete a comment
   */
  deleteComment(commentId: string, userId: string): Promise<void>;

  /**
   * Add a reaction to a comment
   */
  addReaction(
    commentId: string,
    dto: AddCommentReactionDto,
    userId: string,
  ): Promise<ReactionToggleResponseDto>;

  /**
   * Remove a reaction from a comment
   */
  removeReaction(
    commentId: string,
    reactionType: string,
    userId: string,
  ): Promise<ReactionToggleResponseDto>;

  /**
   * Toggle a reaction on a comment
   */
  toggleReaction(
    commentId: string,
    dto: AddCommentReactionDto,
    userId: string,
  ): Promise<ReactionToggleResponseDto>;

  /**
   * Get comments by author
   */
  getCommentsByAuthor(
    authorId: string,
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<CommentPaginationDto>;
}

export interface CommentMapper {
  /**
   * Convert entity to response DTO
   */
  toDto(
    entity: CommentEntity,
    options?: {
      includeAuthor?: boolean;
      includeReactions?: boolean;
      includeReplyCount?: boolean;
      userReaction?: string | null;
    },
  ): CommentResponseDto;

  /**
   * Convert array of entities to response DTOs
   */
  toDtoArray(
    entities: CommentEntity[],
    options?: {
      includeAuthor?: boolean;
      includeReactions?: boolean;
      includeReplyCount?: boolean;
      userReactions?: Map<string, string | null>;
    },
  ): CommentResponseDto[];

  /**
   * Convert entities with pagination info to pagination DTO
   */
  toPaginationDto(
    entities: CommentEntity[],
    total: number,
    page: number,
    limit: number,
    options?: {
      includeAuthor?: boolean;
      includeReactions?: boolean;
      includeReplyCount?: boolean;
      userReactions?: Map<string, string | null>;
    },
  ): CommentPaginationDto;

  /**
   * Convert comment with replies to DTO
   */
  toCommentWithRepliesDto(
    comment: CommentEntity,
    replies: {
      items: CommentEntity[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
    options?: {
      includeAuthor?: boolean;
      includeReactions?: boolean;
      userReaction?: string | null;
      userRepliesReactions?: Map<string, string | null>;
    },
  ): CommentWithRepliesDto;
}
