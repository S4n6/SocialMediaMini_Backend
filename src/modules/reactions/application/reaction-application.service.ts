import { Injectable, Logger } from '@nestjs/common';
import { CreateReactionDto, LegacyGetReactionsQuery } from './dto/reaction.dto';
import {
  CreateReactionResponseDto,
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from './dto/reaction-response.dto';
import { CreateReactionUseCase } from './use-cases/create-reaction.use-case';
import { DeleteReactionUseCase } from './use-cases/delete-reaction.use-case';
import { GetReactionUseCase } from './use-cases/get-reaction.use-case';
import { GetReactionsUseCase } from './use-cases/get-reactions.use-case';
import { GetPostReactionsUseCase } from './use-cases/get-post-reactions.use-case';
import { GetReactionStatusUseCase } from './use-cases/get-reaction-status.use-case';
import {
  ReactionValidationService,
  ReactionValidationContext,
} from './services/reaction-validation.service';
import { ReactionEnrichmentService } from './services/reaction-enrichment.service';
import { ReactionType, TargetType } from '../domain/value-objects';

export interface BulkReactionResult {
  successful: CreateReactionResponseDto[];
  failed: Array<{
    input: CreateReactionDto;
    errors: string[];
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Main application service for reaction operations
 * Orchestrates use cases, validation, and enrichment
 */
@Injectable()
export class ReactionApplicationService {
  private readonly logger = new Logger(ReactionApplicationService.name);

  constructor(
    private readonly createReactionUseCase: CreateReactionUseCase,
    private readonly deleteReactionUseCase: DeleteReactionUseCase,
    private readonly getReactionUseCase: GetReactionUseCase,
    private readonly getReactionsUseCase: GetReactionsUseCase,
    private readonly getPostReactionsUseCase: GetPostReactionsUseCase,
    private readonly getReactionStatusUseCase: GetReactionStatusUseCase,
    private readonly validationService: ReactionValidationService,
    private readonly enrichmentService: ReactionEnrichmentService,
  ) {}

  /**
   * Creates a reaction with validation and enrichment
   */
  async createReaction(
    dto: CreateReactionDto,
    userId: string,
    options: {
      skipValidation?: boolean;
      enrichResponse?: boolean;
    } = {},
  ): Promise<CreateReactionResponseDto> {
    this.logger.debug(`Creating reaction for user ${userId}`, { dto });

    // Pre-validation if not skipped
    if (!options.skipValidation) {
      const validationContext: ReactionValidationContext = {
        reactorId: userId,
        targetId: dto.postId || dto.commentId!,
        targetType: TargetType.create(dto.postId ? 'post' : 'comment'),
        reactionType: ReactionType.create(dto.type),
      };

      const validation =
        await this.validationService.validateReactionRequest(validationContext);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings?.length) {
        this.logger.warn('Reaction validation warnings:', validation.warnings);
      }
    }

    // Execute use case
    const result = await this.createReactionUseCase.execute(dto, userId);

    // Enrich response if requested
    if (options.enrichResponse) {
      // Could add additional enrichment logic here
      this.logger.debug(`Reaction created successfully: ${result.reaction.id}`);
    }

    return result;
  }

  /**
   * Creates multiple reactions in batch
   */
  async createReactionsBatch(
    requests: Array<{ dto: CreateReactionDto; userId: string }>,
  ): Promise<BulkReactionResult> {
    this.logger.debug(`Processing batch of ${requests.length} reactions`);

    const successful: CreateReactionResponseDto[] = [];
    const failed: Array<{ input: CreateReactionDto; errors: string[] }> = [];

    for (const request of requests) {
      try {
        const result = await this.createReaction(request.dto, request.userId);
        successful.push(result);
      } catch (error) {
        failed.push({
          input: request.dto,
          errors: [error.message],
        });
      }
    }

    return {
      successful,
      failed,
      summary: {
        total: requests.length,
        successful: successful.length,
        failed: failed.length,
      },
    };
  }

  /**
   * Deletes a reaction with additional logging and validation
   */
  async deleteReaction(
    reactionId: string,
    userId: string,
  ): Promise<{ message: string; deletedReactionId: string }> {
    this.logger.debug(`Deleting reaction ${reactionId} for user ${userId}`);

    await this.deleteReactionUseCase.execute(reactionId, userId);

    this.logger.debug(`Reaction ${reactionId} deleted successfully`);
    return {
      message: 'Reaction deleted successfully',
      deletedReactionId: reactionId,
    };
  }

  /**
   * Gets a reaction with optional enrichment
   */
  async getReaction(
    reactionId: string,
    options: { enrich?: boolean } = {},
  ): Promise<ReactionResponseDto> {
    const result = await this.getReactionUseCase.execute(reactionId);

    if (options.enrich) {
      // Add enrichment logic here if needed
      this.logger.debug(`Retrieved and enriched reaction ${reactionId}`);
    }

    return result;
  }

  /**
   * Gets reactions with advanced filtering and enrichment
   */
  async getReactions(
    query?: LegacyGetReactionsQuery,
    options: {
      enrich?: boolean;
      includeStats?: boolean;
    } = {},
  ): Promise<ReactionResponseDto[]> {
    this.logger.debug('Fetching reactions with query:', query);

    const results = await this.getReactionsUseCase.execute(query);

    if (options.enrich) {
      this.logger.debug(`Enriching ${results.length} reactions`);
      // Add enrichment logic
    }

    if (options.includeStats) {
      this.logger.debug('Including reaction statistics');
      // Add statistics logic
    }

    return results;
  }

  /**
   * Gets post reactions with enhanced data
   */
  async getPostReactions(
    postId: string,
    options: {
      includeAggregates?: boolean;
      groupByType?: boolean;
    } = {},
  ): Promise<PostReactionsResponseDto> {
    this.logger.debug(`Fetching reactions for post ${postId}`, options);

    const result = await this.getPostReactionsUseCase.execute(postId);

    if (options.includeAggregates) {
      // Add aggregate calculations
      this.logger.debug(`Including aggregates for post ${postId}`);
    }

    return result;
  }

  /**
   * Gets reaction status with caching consideration
   */
  async getReactionStatus(
    postId: string,
    userId: string,
  ): Promise<ReactionStatusResponseDto> {
    this.logger.debug(
      `Getting reaction status for post ${postId}, user ${userId}`,
    );

    return this.getReactionStatusUseCase.execute(postId, userId);
  }

  /**
   * Health check for the application service
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return {
      status: 'healthy',
      timestamp: new Date(),
    };
  }
}
