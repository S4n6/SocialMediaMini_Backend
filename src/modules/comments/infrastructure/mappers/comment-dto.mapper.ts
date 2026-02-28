import { Injectable } from '@nestjs/common';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { CommentMapper } from '../../application/interfaces/comment-application.interface';
import {
  CommentResponseDto,
  CommentPaginationDto,
  CommentWithRepliesDto,
} from '../../application/dto/comment.dto';

/**
 * Infrastructure mapper — converts domain entities into application-layer DTOs.
 * Implements the `CommentMapper` port defined in the application layer.
 */
@Injectable()
export class CommentDtoMapper implements CommentMapper {
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
      ...(options?.includeAuthor && { author: undefined }),
      ...(options?.includeReactions && { reactions: {} }),
      ...(options?.includeReplyCount && { replyCount: 0 }),
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
