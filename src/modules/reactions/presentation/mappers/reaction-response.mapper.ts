import { Injectable } from '@nestjs/common';
import { ReactionEntity } from '../../domain/entities/reaction.entity';
import {
  ReactionResponseDto,
  CreateReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from '../dto/reaction-response.dto';

export interface UserProfile {
  id: string;
  fullName: string;
  avatar: string | null;
}

export interface ReactionWithUser {
  reaction: ReactionEntity;
  user: UserProfile;
}

@Injectable()
export class ReactionResponseMapper {
  static toReactionResponseDto(
    reaction: ReactionEntity,
    userProfile?: UserProfile,
  ): ReactionResponseDto {
    return {
      id: reaction.id,
      type: reaction.type,
      reactorId: reaction.reactorId,
      postId: reaction.targetType === 'post' ? reaction.targetId : null,
      commentId: reaction.targetType === 'comment' ? reaction.targetId : null,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
      reactor: userProfile
        ? {
            id: userProfile.id,
            fullName: userProfile.fullName,
            avatar: userProfile.avatar,
          }
        : undefined,
    };
  }

  static toCreateReactionResponseDto(
    reaction: ReactionEntity,
    isNew: boolean,
    message?: string,
  ): CreateReactionResponseDto {
    return {
      message:
        message ||
        (isNew
          ? 'Reaction created successfully'
          : 'Reaction updated successfully'),
      reacted: true,
      reaction: this.toReactionResponseDto(reaction),
      isNew,
    };
  }

  static toPostReactionsResponseDto(
    postId: string,
    reactions: ReactionWithUser[],
  ): PostReactionsResponseDto {
    return {
      postId,
      totalReactions: reactions.length,
      reactions: reactions.map(({ reaction, user }) => ({
        reaction: this.toReactionResponseDto(reaction, user),
        reactor: {
          id: user.id,
          fullName: user.fullName,
          avatar: user.avatar,
        },
      })),
    };
  }

  static toReactionStatusResponseDto(
    targetId: string,
    userId: string,
    reaction?: ReactionEntity,
  ): ReactionStatusResponseDto {
    return {
      targetId,
      userId,
      reacted: !!reaction,
      reactionId: reaction?.id || null,
      reactionType: reaction?.type || null,
    };
  }

  // Remove this method since ReactionStatsEntity doesn't exist yet
  // static toReactionStatsResponseDto would be implemented when stats entity is created

  static toReactionListResponseDto(
    reactions: ReactionWithUser[],
    totalCount?: number,
    page?: number,
    limit?: number,
  ): {
    data: ReactionResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const data = reactions.map(({ reaction, user }) =>
      this.toReactionResponseDto(reaction, user),
    );

    const total = totalCount ?? reactions.length;
    const currentPage = page ?? 1;
    const pageLimit = limit ?? reactions.length;
    const totalPages = Math.ceil(total / pageLimit);

    return {
      data,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    };
  }

  static toBulkReactionResponseDto(
    successfulReactions: ReactionEntity[],
    failedReactions: Array<{ targetId: string; error: string }>,
    operation: 'create' | 'remove',
  ): {
    success: boolean;
    message: string;
    data: {
      successful: ReactionResponseDto[];
      failed: Array<{ targetId: string; error: string }>;
      stats: {
        total: number;
        successful: number;
        failed: number;
      };
    };
  } {
    const successful = successfulReactions.map((reaction) =>
      this.toReactionResponseDto(reaction),
    );

    const stats = {
      total: successful.length + failedReactions.length,
      successful: successful.length,
      failed: failedReactions.length,
    };

    return {
      success: stats.failed === 0,
      message: `Bulk ${operation} completed: ${stats.successful}/${stats.total} successful`,
      data: {
        successful,
        failed: failedReactions,
        stats,
      },
    };
  }

  static toHealthResponseDto(
    isHealthy: boolean,
    metrics: any,
    timestamp: Date,
  ): {
    status: string;
    service: string;
    timestamp: Date;
    metrics: any;
    checks: {
      database: boolean;
      cache: boolean;
      events: boolean;
    };
  } {
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'reactions-service',
      timestamp,
      metrics,
      checks: {
        database: true, // Would be determined by actual health checks
        cache: true,
        events: true,
      },
    };
  }

  static toErrorResponseDto(
    error: Error,
    path: string,
    method: string,
    timestamp: Date,
    requestId?: string,
  ): {
    success: false;
    error: {
      code: string;
      message: string;
      path: string;
      method: string;
      timestamp: Date;
      requestId?: string;
    };
    data: null;
  } {
    return {
      success: false,
      error: {
        code: error.constructor.name.replace('Exception', '').toUpperCase(),
        message: error.message,
        path,
        method,
        timestamp,
        requestId,
      },
      data: null,
    };
  }

  // Utility methods for data transformation
  static enrichReactionWithMetadata(
    reaction: ReactionEntity,
    metadata: {
      isOwner?: boolean;
      canModify?: boolean;
      viewerReaction?: ReactionEntity;
    },
  ): ReactionResponseDto & {
    metadata: {
      isOwner: boolean;
      canModify: boolean;
      viewerReaction?: ReactionResponseDto;
    };
  } {
    const baseResponse = this.toReactionResponseDto(reaction);

    return {
      ...baseResponse,
      metadata: {
        isOwner: metadata.isOwner ?? false,
        canModify: metadata.canModify ?? false,
        viewerReaction: metadata.viewerReaction
          ? this.toReactionResponseDto(metadata.viewerReaction)
          : undefined,
      },
    };
  }

  static groupReactionsByType(reactions: ReactionEntity[]): Record<
    string,
    {
      type: string;
      count: number;
      reactions: ReactionResponseDto[];
    }
  > {
    const grouped = reactions.reduce(
      (acc, reaction) => {
        const type = reaction.type;
        if (!acc[type]) {
          acc[type] = {
            type,
            count: 0,
            reactions: [],
          };
        }
        acc[type].count++;
        acc[type].reactions.push(this.toReactionResponseDto(reaction));
        return acc;
      },
      {} as Record<
        string,
        { type: string; count: number; reactions: ReactionResponseDto[] }
      >,
    );

    return grouped;
  }

  static calculateReactionSummary(reactions: ReactionEntity[]): {
    totalReactions: number;
    reactionTypes: Array<{ type: string; count: number; percentage: number }>;
    mostPopularType: string | null;
    diversityScore: number; // 0-1, higher means more diverse reactions
  } {
    const total = reactions.length;

    if (total === 0) {
      return {
        totalReactions: 0,
        reactionTypes: [],
        mostPopularType: null,
        diversityScore: 0,
      };
    }

    const typeCounts = reactions.reduce(
      (acc, reaction) => {
        const type = reaction.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const reactionTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const mostPopularType = reactionTypes[0]?.type || null;

    // Calculate diversity score (entropy-based)
    const diversityScore =
      reactionTypes.length > 1
        ? reactionTypes.reduce((entropy, { count }) => {
            const p = count / total;
            return entropy - p * Math.log2(p);
          }, 0) / Math.log2(reactionTypes.length)
        : 0;

    return {
      totalReactions: total,
      reactionTypes,
      mostPopularType,
      diversityScore: Math.round(diversityScore * 100) / 100,
    };
  }
}
