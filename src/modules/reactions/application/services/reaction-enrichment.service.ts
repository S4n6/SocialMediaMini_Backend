import { Injectable, Logger } from '@nestjs/common';
import { ReactionEntity } from '../../domain/entities/reaction.entity';
import { ReactionEvents } from '../../domain/reaction.events';

export interface ReactionEnrichmentData {
  reactorInfo?: {
    id: string;
    fullName: string;
    avatar: string | null;
    isVerified?: boolean;
  };
  targetInfo?: {
    id: string;
    authorId: string;
    content: string;
    type: 'post' | 'comment';
    createdAt: Date;
  };
  contextualInfo?: {
    isFirstReaction: boolean;
    totalReactionsOnTarget: number;
    userPreviousReactionType?: string;
  };
}

/**
 * Service for enriching reaction data with additional context
 * Coordinates with external services to provide complete information
 */
@Injectable()
export class ReactionEnrichmentService {
  private readonly logger = new Logger(ReactionEnrichmentService.name);

  /**
   * Enriches a reaction entity with additional context data
   */
  async enrichReaction(
    reaction: ReactionEntity,
    options: {
      includeReactor?: boolean;
      includeTarget?: boolean;
      includeContext?: boolean;
    } = {},
  ): Promise<ReactionEntity & { enrichment?: ReactionEnrichmentData }> {
    const enrichment: ReactionEnrichmentData = {};

    try {
      // Enrich reactor info
      if (options.includeReactor) {
        enrichment.reactorInfo = await this.getReactorInfo(reaction.reactorId);
      }

      // Enrich target info
      if (options.includeTarget) {
        enrichment.targetInfo = await this.getTargetInfo(
          reaction.targetId,
          reaction.targetType,
        );
      }

      // Enrich contextual info
      if (options.includeContext) {
        enrichment.contextualInfo = await this.getContextualInfo(reaction);
      }

      return Object.assign(reaction, { enrichment });
    } catch (error) {
      this.logger.warn(
        `Failed to enrich reaction ${reaction.id}:`,
        error.message,
      );
      return reaction;
    }
  }

  /**
   * Enriches multiple reactions efficiently
   */
  async enrichReactions(
    reactions: ReactionEntity[],
    options: {
      includeReactor?: boolean;
      includeTarget?: boolean;
      includeContext?: boolean;
    } = {},
  ): Promise<Array<ReactionEntity & { enrichment?: ReactionEnrichmentData }>> {
    // Batch enrichment for better performance
    const reactorIds = new Set(reactions.map((r) => r.reactorId));
    const targetIds = new Set(reactions.map((r) => r.targetId));

    // Pre-fetch reactor info
    const reactorInfoMap = options.includeReactor
      ? await this.getReactorInfoBatch([...reactorIds])
      : new Map();

    // Pre-fetch target info
    const targetInfoMap = options.includeTarget
      ? await this.getTargetInfoBatch([...targetIds])
      : new Map();

    return Promise.all(
      reactions.map(async (reaction) => {
        const enrichment: ReactionEnrichmentData = {};

        if (options.includeReactor) {
          enrichment.reactorInfo = reactorInfoMap.get(reaction.reactorId);
        }

        if (options.includeTarget) {
          enrichment.targetInfo = targetInfoMap.get(reaction.targetId);
        }

        if (options.includeContext) {
          enrichment.contextualInfo = await this.getContextualInfo(reaction);
        }

        return Object.assign(reaction, { enrichment });
      }),
    );
  }

  /**
   * Creates enrichment data for domain events
   */
  async enrichDomainEvent(event: ReactionEvents): Promise<ReactionEvents> {
    // Add enrichment data to domain events for better context
    // This could include user info, target info, etc.
    return event;
  }

  private async getReactorInfo(reactorId: string) {
    // Mock implementation - would call user service
    return {
      id: reactorId,
      fullName: 'User Name',
      avatar: null,
      isVerified: false,
    };
  }

  private async getTargetInfo(targetId: string, targetType: string) {
    // Mock implementation - would call post/comment service
    return {
      id: targetId,
      authorId: 'author-id',
      content: 'Target content',
      type: targetType as 'post' | 'comment',
      createdAt: new Date(),
    };
  }

  private async getContextualInfo(reaction: ReactionEntity) {
    // Mock implementation - would calculate contextual information
    return {
      isFirstReaction: true,
      totalReactionsOnTarget: 1,
    };
  }

  private async getReactorInfoBatch(reactorIds: string[]) {
    // Batch fetch reactor info
    const map = new Map();
    for (const id of reactorIds) {
      map.set(id, await this.getReactorInfo(id));
    }
    return map;
  }

  private async getTargetInfoBatch(targetIds: string[]) {
    // Batch fetch target info
    const map = new Map();
    for (const id of targetIds) {
      map.set(id, await this.getTargetInfo(id, 'post')); // Would determine type properly
    }
    return map;
  }
}
