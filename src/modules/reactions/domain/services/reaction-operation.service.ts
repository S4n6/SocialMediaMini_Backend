import { Injectable, Inject } from '@nestjs/common';
import { ReactionEntity } from '../entities/reaction.entity';
import { ReactionType, TargetType } from '../value-objects';
import {
  IReactionBaseRepository,
  IReactionFinderRepository,
} from '../repositories/reaction.repository';
import { ReactionBusinessRulesService } from './reaction-business-rules.service';
import {
  ReactionNotFoundException,
  UnauthorizedReactionException,
  InvalidReactionTargetException,
} from '../exceptions/reaction.exceptions';
import {
  REACTION_BASE_REPOSITORY,
  REACTION_FINDER_REPOSITORY,
} from '../../constants';

export interface ReactionOperationResult {
  reaction: ReactionEntity;
  isNew: boolean;
  action: 'created' | 'updated' | 'removed';
}

/**
 * Domain service for coordinating reaction operations
 * Orchestrates business rules and repository operations
 */
@Injectable()
export class ReactionOperationService {
  constructor(
    @Inject(REACTION_BASE_REPOSITORY)
    private readonly baseRepository: IReactionBaseRepository,
    @Inject(REACTION_FINDER_REPOSITORY)
    private readonly finderRepository: IReactionFinderRepository,
    private readonly businessRules: ReactionBusinessRulesService,
  ) {}

  /**
   * Creates or updates a reaction based on business rules
   */
  async processReaction(
    reactionType: ReactionType,
    reactorId: string,
    targetId: string,
    targetType: TargetType,
  ): Promise<ReactionOperationResult> {
    // Validate business constraints
    const validation = this.businessRules.validateReactionConstraints(
      reactorId,
      targetId,
      targetType,
      reactionType,
    );

    if (!validation.isValid) {
      throw new InvalidReactionTargetException();
    }

    // Check for existing reaction
    const existingReaction = await this.finderRepository.findByUserAndTarget(
      reactorId,
      targetId,
      targetType.getValue(),
    );

    if (existingReaction) {
      return this.handleExistingReaction(existingReaction, reactionType);
    }

    return this.createNewReaction(
      reactionType,
      reactorId,
      targetId,
      targetType,
    );
  }

  /**
   * Validates reaction ownership and returns the reaction
   */
  async validateOwnership(
    reactionId: string,
    userId: string,
  ): Promise<ReactionEntity> {
    const reaction = await this.baseRepository.findById(reactionId);

    if (!reaction) {
      throw new ReactionNotFoundException(reactionId);
    }

    if (!reaction.isOwnedBy(userId)) {
      throw new UnauthorizedReactionException();
    }

    return reaction;
  }

  /**
   * Removes a reaction after ownership validation
   */
  async removeReaction(reactionId: string, userId: string): Promise<void> {
    await this.validateOwnership(reactionId, userId);
    await this.baseRepository.delete(reactionId);
  }

  private async handleExistingReaction(
    existingReaction: ReactionEntity,
    newReactionType: ReactionType,
  ): Promise<ReactionOperationResult> {
    const decision = this.businessRules.shouldUpdateExistingReaction(
      existingReaction,
      newReactionType,
    );

    switch (decision.action) {
      case 'remove':
        await this.baseRepository.delete(existingReaction.id);
        return {
          reaction: existingReaction,
          isNew: false,
          action: 'removed',
        };

      case 'update':
        existingReaction.updateType(newReactionType.getValue());
        const updatedReaction =
          await this.baseRepository.save(existingReaction);
        return {
          reaction: updatedReaction,
          isNew: false,
          action: 'updated',
        };

      default:
        return {
          reaction: existingReaction,
          isNew: false,
          action: 'updated', // No change but return existing
        };
    }
  }

  private async createNewReaction(
    reactionType: ReactionType,
    reactorId: string,
    targetId: string,
    targetType: TargetType,
  ): Promise<ReactionOperationResult> {
    const newReaction = ReactionEntity.createNew(
      reactionType.getValue(),
      reactorId,
      targetId,
      targetType.getValue(),
    );

    const savedReaction = await this.baseRepository.save(newReaction);

    return {
      reaction: savedReaction,
      isNew: true,
      action: 'created',
    };
  }
}
