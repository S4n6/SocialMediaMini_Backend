import { ReactionEntity, ReactionType, TargetType } from '../../domain';
import {
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from '../dto/reaction-response.dto';
import {
  ReactionWithReactor,
  PostReactionsResult,
  ReactionStatusResult,
} from '../../domain/repositories/reaction.repository';
import {
  CreateReactionCommand,
  UpdateReactionCommand,
  DeleteReactionCommand,
} from '../dto/commands/reaction-commands.dto';
import {
  GetReactionsQuery,
  GetReactionStatsQuery,
} from '../dto/queries/reaction-queries.dto';
import {
  CreateReactionDto,
  LegacyGetReactionsQuery,
} from '../dto/reaction.dto';

/**
 * Enhanced mapper with support for domain value objects and commands/queries
 */
export class ReactionMapper {
  // Entity to Response DTO mappings
  static toResponseDto(entity: ReactionEntity): ReactionResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      reactorId: entity.reactorId,
      postId: entity.postId,
      commentId: entity.commentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEnhancedResponseDto(
    entity: ReactionEntity,
    options: {
      includeValueObjects?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): ReactionResponseDto & {
    valueObjects?: {
      reactionType: ReactionType;
      targetType: TargetType;
    };
    metadata?: {
      isPositive: boolean;
      isNegative: boolean;
      targetTypeName: string;
    };
  } {
    const baseDto = this.toResponseDto(entity);

    if (options.includeValueObjects) {
      (baseDto as any).valueObjects = {
        reactionType: ReactionType.create(entity.type),
        targetType: TargetType.create(entity.targetType),
      };
    }

    if (options.includeMetadata) {
      const reactionType = ReactionType.create(entity.type);
      (baseDto as any).metadata = {
        isPositive: reactionType.isPositive(),
        isNegative: reactionType.isNegative(),
        targetTypeName: entity.targetType,
      };
    }

    return baseDto;
  }

  static toResponseDtoWithReactor(
    data: ReactionWithReactor,
  ): ReactionResponseDto {
    return {
      ...this.toResponseDto(data.reaction),
      reactor: data.reactor,
    };
  }

  static toPostReactionsResponseDto(
    result: PostReactionsResult,
  ): PostReactionsResponseDto {
    return {
      postId: result.postId,
      totalReactions: result.totalReactions,
      reactions: result.reactions.map((reactionWithReactor) => ({
        reaction: this.toResponseDto(reactionWithReactor.reaction),
        reactor: reactionWithReactor.reactor,
      })),
    };
  }

  static toReactionStatusResponseDto(
    result: ReactionStatusResult,
  ): ReactionStatusResponseDto {
    return {
      targetId: result.targetId,
      userId: result.userId,
      reacted: result.reacted,
      reactionId: result.reactionId,
      reactionType: result.reactionType,
    };
  }

  static toResponseDtoArray(entities: ReactionEntity[]): ReactionResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  // Command/Query mappings
  static toCreateReactionCommand(
    dto: CreateReactionDto,
    reactorId: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    },
  ): CreateReactionCommand {
    return {
      reactorId,
      targetId: dto.postId || dto.commentId!,
      targetType: dto.postId ? 'post' : 'comment',
      reactionType: dto.type as any,
      metadata: metadata
        ? {
            ...metadata,
            timestamp: new Date(),
          }
        : undefined,
    };
  }

  static toGetReactionsQuery(
    legacyQuery?: LegacyGetReactionsQuery,
  ): GetReactionsQuery {
    if (!legacyQuery) {
      return {};
    }

    return {
      postId: legacyQuery.postId,
      commentId: legacyQuery.commentId,
      reactorId: legacyQuery.reactorId,
      targetType: legacyQuery.targetType,
      limit: legacyQuery.limit,
      offset: legacyQuery.offset,
      includeReactor: true,
      includeTarget: false,
      includeMetadata: false,
    };
  }

  // Domain to application layer mappings
  static fromDomainEntity(entity: ReactionEntity): {
    id: string;
    reactionType: ReactionType;
    targetType: TargetType;
    reactorId: string;
    targetId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: entity.id,
      reactionType: ReactionType.create(entity.type),
      targetType: TargetType.create(entity.targetType),
      reactorId: entity.reactorId,
      targetId: entity.targetId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  // Utility methods
  static groupReactionsByType(
    reactions: ReactionEntity[],
  ): Record<string, ReactionEntity[]> {
    return reactions.reduce(
      (acc, reaction) => {
        const type = reaction.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(reaction);
        return acc;
      },
      {} as Record<string, ReactionEntity[]>,
    );
  }

  static calculateReactionStats(reactions: ReactionEntity[]): {
    total: number;
    byType: Record<string, number>;
    mostPopular: string | null;
    positiveCount: number;
    negativeCount: number;
  } {
    const byType: Record<string, number> = {};
    let positiveCount = 0;
    let negativeCount = 0;

    reactions.forEach((reaction) => {
      byType[reaction.type] = (byType[reaction.type] || 0) + 1;

      const reactionType = ReactionType.create(reaction.type);
      if (reactionType.isPositive()) {
        positiveCount++;
      } else if (reactionType.isNegative()) {
        negativeCount++;
      }
    });

    const mostPopular =
      Object.entries(byType).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    return {
      total: reactions.length,
      byType,
      mostPopular,
      positiveCount,
      negativeCount,
    };
  }
}
