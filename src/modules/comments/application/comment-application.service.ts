import { Injectable, Inject } from '@nestjs/common';
import {
  CommentApplicationService,
  CommentMapper,
} from './interfaces/comment-application.interface';
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
} from './dto/comment.dto';
import { CommentEntity } from '../domain/comment.entity';

// Use Cases
import { CreateCommentUseCase } from './use-cases/create-comment.use-case';
import { GetCommentsByPostUseCase } from './use-cases/get-comments-by-post.use-case';
import { GetCommentByIdUseCase } from './use-cases/get-comment-by-id.use-case';
import { UpdateCommentUseCase } from './use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './use-cases/delete-comment.use-case';
import { AddReactionUseCase } from './use-cases/add-reaction.use-case';
import { RemoveReactionUseCase } from './use-cases/remove-reaction.use-case';
import { GetRepliesUseCase } from './use-cases/get-replies.use-case';

@Injectable()
export class CommentApplicationServiceImpl
  implements CommentApplicationService
{
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getCommentsByPostUseCase: GetCommentsByPostUseCase,
    private readonly getCommentByIdUseCase: GetCommentByIdUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly removeReactionUseCase: RemoveReactionUseCase,
    private readonly getRepliesUseCase: GetRepliesUseCase,
    @Inject('CommentMapper')
    private readonly commentMapper: CommentMapper,
  ) {}

  async createComment(
    dto: CreateCommentDto,
    authorId: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.createCommentUseCase.execute({
      content: dto.content,
      postId: dto.postId,
      parentId: dto.parentId,
      authorId,
    });

    return this.commentMapper.toDto(comment);
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

@Injectable()
export class CommentMapperImpl implements CommentMapper {
  toDto(
    entity: CommentEntity,
    options?: {
      includeAuthor?: boolean;
      includeReactions?: boolean;
      includeReplyCount?: boolean;
      userReaction?: string | null;
    },
  ): CommentResponseDto {
    return {
      id: entity.id,
      content: entity.content,
      authorId: entity.authorId,
      postId: entity.postId,
      parentId: entity.parentId,
      isReply: !!entity.parentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      ...(options?.includeAuthor && { author: undefined }), // Would be populated with user data
      ...(options?.includeReactions && { reactions: {} }), // Would be populated with reaction counts
      ...(options?.includeReplyCount && { replyCount: 0 }), // Would be populated with reply count
      ...(options?.userReaction !== undefined && {
        userReaction: options.userReaction,
      }),
    };
  }

  toDtoArray(
    entities: CommentEntity[],
    options?: {
      includeAuthor?: boolean;
      includeReactions?: boolean;
      includeReplyCount?: boolean;
      userReactions?: Map<string, string | null>;
    },
  ): CommentResponseDto[] {
    return entities.map((entity) =>
      this.toDto(entity, {
        ...options,
        userReaction: options?.userReactions?.get(entity.id),
      }),
    );
  }

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
  ): CommentPaginationDto {
    const totalPages = Math.ceil(total / limit);
    const items = this.toDtoArray(entities, options);

    return {
      items,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

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
  ): CommentWithRepliesDto {
    const commentDto = this.toDto(comment, options);
    const repliesDto = this.toDtoArray(replies.items, {
      ...options,
      userReactions: options?.userRepliesReactions,
    });

    return {
      ...commentDto,
      replies: {
        items: repliesDto,
        total: replies.total,
        page: replies.page,
        limit: replies.limit,
        totalPages: replies.totalPages,
        hasNext: replies.page < replies.totalPages,
        hasPrev: replies.page > 1,
      },
    };
  }
}
