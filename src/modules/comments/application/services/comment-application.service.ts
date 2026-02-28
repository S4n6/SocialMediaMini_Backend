import { Injectable, Inject } from '@nestjs/common';
import {
  CommentApplicationService,
  CommentMapper,
} from '../interfaces/comment-application.interface';
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

// Use Cases
import { CreateCommentUseCase } from '../use-cases/create-comment.use-case';
import { GetCommentsByPostUseCase } from '../use-cases/get-comments-by-post.use-case';
import { GetCommentByIdUseCase } from '../use-cases/get-comment-by-id.use-case';
import { UpdateCommentUseCase } from '../use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from '../use-cases/delete-comment.use-case';
import { AddReactionUseCase } from '../use-cases/add-reaction.use-case';
import { RemoveReactionUseCase } from '../use-cases/remove-reaction.use-case';
import { GetRepliesUseCase } from '../use-cases/get-replies.use-case';

// Services
import { CommentEnrichmentService } from './comment-enrichment.service';
import { APPLICATION_TOKENS } from '../../constants';

/**
 * Comment Application Service
 *
 * Responsibilities:
 * - Orchestrate use cases for complex business flows
 * - Handle cross-cutting concerns (logging, metrics, transactions)
 * - Coordinate between use cases and enrichment services
 * - Transform domain entities to DTOs for presentation layer
 * - Manage application-level error handling
 */
@Injectable()
export class CommentApplicationServiceImpl
  implements CommentApplicationService
{
  constructor(
    // Use Cases
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getCommentsByPostUseCase: GetCommentsByPostUseCase,
    private readonly getCommentByIdUseCase: GetCommentByIdUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly removeReactionUseCase: RemoveReactionUseCase,
    private readonly getRepliesUseCase: GetRepliesUseCase,

    // Services
    private readonly enrichmentService: CommentEnrichmentService,

    @Inject(APPLICATION_TOKENS.COMMENT_MAPPER)
    private readonly commentMapper: CommentMapper,
  ) {}

  /**
   * Create Comment - Orchestrates comment creation with enrichment
   */
  async createComment(
    dto: CreateCommentDto,
    authorId: string,
  ): Promise<CommentResponseDto> {
    try {
      // Step 1: Execute use case to create comment
      const comment = await this.createCommentUseCase.execute({
        content: dto.content,
        postId: dto.postId,
        parentId: dto.parentId,
        authorId,
      });

      // Step 2: Enrich comment with additional data
      const enrichedData = await this.enrichmentService.enrichComment(comment, {
        includeAuthor: true,
        includeReactions: true,
        includeReplyCount: false, // New comments don't have replies yet
        includeUserReaction: false, // Author hasn't reacted to their own comment
      });

      // Step 3: Transform to DTO
      return this.commentMapper.toDto(enrichedData.comment, {
        includeAuthor: true,
        includeReactions: true,
        // TODO: Need to update mapper to accept enriched data
      });
    } catch (error) {
      // Application-level error handling
      console.error(
        '[CommentApplicationService] Error in createComment:',
        error,
      );
      throw error;
    }
  }

  async getCommentsByPost(
    postId: string,
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<CommentPaginationDto> {
    const result = await this.getCommentsByPostUseCase.execute({
      postId,
      page: dto.page || 1,
      limit: dto.limit || 10,
      sortBy: dto.sortBy,
    });

    return this.commentMapper.toPaginationDto(
      result.items,
      result.total,
      result.page,
      result.limit,
    );
  }

  async getCommentWithReplies(
    commentId: string,
    dto: GetRepliesDto,
    userId?: string,
  ): Promise<CommentWithRepliesDto> {
    const comment = await this.getCommentByIdUseCase.execute({ commentId });
    const replies = await this.getRepliesUseCase.execute({
      commentId,
      page: dto.page || 1,
      limit: dto.limit || 10,
    });

    return this.commentMapper.toCommentWithRepliesDto(comment, replies);
  }

  async getRepliesForComment(
    commentId: string,
    dto: GetRepliesDto,
    userId?: string,
  ): Promise<CommentPaginationDto> {
    const result = await this.getRepliesUseCase.execute({
      commentId,
      page: dto.page || 1,
      limit: dto.limit || 10,
    });

    return this.commentMapper.toPaginationDto(
      result.items,
      result.total,
      result.page,
      result.limit,
    );
  }

  async getCommentById(
    commentId: string,
    userId?: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.getCommentByIdUseCase.execute({ commentId });
    return this.commentMapper.toDto(comment);
  }

  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.updateCommentUseCase.execute({
      commentId,
      userId,
      content: dto.content,
    });

    return this.commentMapper.toDto(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    await this.deleteCommentUseCase.execute({
      commentId,
      userId,
    });
  }

  async addReaction(
    commentId: string,
    dto: AddCommentReactionDto,
    userId: string,
  ): Promise<ReactionToggleResponseDto> {
    await this.addReactionUseCase.execute({
      commentId,
      userId,
      reactionType: dto.reactionType,
    });

    // Get updated reaction counts (this would be implemented in repository)
    return {
      commentId,
      reactionType: dto.reactionType,
      added: true,
      newCount: 1, // This should be fetched from repository
    };
  }

  async removeReaction(
    commentId: string,
    reactionType: string,
    userId: string,
  ): Promise<ReactionToggleResponseDto> {
    await this.removeReactionUseCase.execute({
      commentId,
      userId,
      reactionType,
    });

    return {
      commentId,
      reactionType,
      added: false,
      newCount: 0, // This should be fetched from repository
    };
  }

  async toggleReaction(
    commentId: string,
    dto: AddCommentReactionDto,
    userId: string,
  ): Promise<ReactionToggleResponseDto> {
    // Implementation would check if reaction exists, then add or remove
    // For now, just delegate to addReaction
    return this.addReaction(commentId, dto, userId);
  }

  async getCommentsByAuthor(
    authorId: string,
    dto: GetCommentsDto,
    userId?: string,
  ): Promise<CommentPaginationDto> {
    // This would require a new use case for getting comments by author
    throw new Error('Not implemented yet');
  }
}
