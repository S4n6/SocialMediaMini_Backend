/**
 * Comment Enrichment Service
 *
 * This service is responsible for enriching comment entities with additional data
 * such as user information, reaction counts, reply counts, etc.
 * It acts as a bridge between the domain layer and external data sources.
 */

import { Injectable, Inject } from '@nestjs/common';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { IUserDomainPort } from '../../domain/interfaces/domain-ports.interface';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { COMMENT_TOKENS, INFRASTRUCTURE_TOKENS } from '../../constants';

export interface EnrichedCommentData {
  comment: CommentEntity;
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

export interface CommentEnrichmentOptions {
  includeAuthor?: boolean;
  includeReactions?: boolean;
  includeReplyCount?: boolean;
  includeUserReaction?: boolean;
  userId?: string; // For user-specific data like userReaction
}

@Injectable()
export class CommentEnrichmentService {
  constructor(
    @Inject(COMMENT_TOKENS.COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
    @Inject(INFRASTRUCTURE_TOKENS.USER_SERVICE_ADAPTER)
    private readonly userDomainPort: IUserDomainPort,
  ) {}

  /**
   * Enrich a single comment with additional data
   */
  async enrichComment(
    comment: CommentEntity,
    options: CommentEnrichmentOptions = {},
  ): Promise<EnrichedCommentData> {
    const enrichedData: EnrichedCommentData = { comment };

    // Enrich author information
    if (options.includeAuthor) {
      enrichedData.author = await this.getAuthorInfo(comment.authorId);
    }

    // Enrich reaction counts
    if (options.includeReactions) {
      enrichedData.reactions = await this.getReactionCounts(comment.id);
    }

    // Enrich reply count
    if (options.includeReplyCount) {
      enrichedData.replyCount = await this.getReplyCount(comment.id);
    }

    // Enrich user-specific reaction
    if (options.includeUserReaction && options.userId) {
      enrichedData.userReaction = await this.getUserReaction(
        comment.id,
        options.userId,
      );
    }

    return enrichedData;
  }

  /**
   * Enrich multiple comments with additional data
   */
  async enrichComments(
    comments: CommentEntity[],
    options: CommentEnrichmentOptions = {},
  ): Promise<EnrichedCommentData[]> {
    // For better performance, we could batch the external calls
    // But for simplicity, we'll process them individually for now
    const enrichedComments = await Promise.all(
      comments.map((comment) => this.enrichComment(comment, options)),
    );

    return enrichedComments;
  }

  /**
   * Get author information for a comment
   */
  private async getAuthorInfo(authorId: string): Promise<
    | {
        id: string;
        username: string;
        fullName: string;
        avatar?: string;
      }
    | undefined
  > {
    try {
      // In real implementation, this would call the user service
      // For now, we'll return mock data
      const userExists = await this.userDomainPort.exists(authorId);

      if (!userExists) {
        return undefined;
      }

      // Mock author data - in real implementation, this would come from user service
      return {
        id: authorId,
        username: `user_${authorId.slice(-8)}`,
        fullName: `User ${authorId.slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}`,
      };
    } catch (error) {
      console.error(`Error fetching author info for ${authorId}:`, error);
      return undefined;
    }
  }

  /**
   * Get reaction counts for a comment
   */
  private async getReactionCounts(commentId: string): Promise<{
    [key: string]: number;
  }> {
    try {
      return await this.commentRepository.getReactionCounts(commentId);
    } catch (error) {
      console.error(`Error fetching reaction counts for ${commentId}:`, error);
      return {};
    }
  }

  /**
   * Get reply count for a comment
   */
  private async getReplyCount(commentId: string): Promise<number> {
    try {
      return await this.commentRepository.countRepliesByCommentId(commentId);
    } catch (error) {
      console.error(`Error fetching reply count for ${commentId}:`, error);
      return 0;
    }
  }

  /**
   * Get user's reaction to a comment
   */
  private async getUserReaction(
    commentId: string,
    userId: string,
  ): Promise<string | null> {
    try {
      // Check each reaction type to see if user has reacted
      const reactionTypes = ['like', 'love', 'laugh', 'angry', 'sad'];

      for (const reactionType of reactionTypes) {
        const hasReacted = await this.commentRepository.hasUserReacted(
          commentId,
          userId,
          reactionType,
        );

        if (hasReacted) {
          return reactionType;
        }
      }

      return null;
    } catch (error) {
      console.error(
        `Error fetching user reaction for ${commentId}, ${userId}:`,
        error,
      );
      return null;
    }
  }
}
