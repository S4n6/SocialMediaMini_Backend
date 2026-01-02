import { Injectable, Inject } from '@nestjs/common';
import { ReactionEntity } from '../entities/reaction.entity';
import { ReactionType, TargetType } from '../value-objects';
import {
  ReactionOperationService,
  ReactionOperationResult,
} from './reaction-operation.service';
import { IReactionFinderRepository } from '../repositories/reaction.repository';
import {
  ReactionType as ReactionTypeEnum,
  REACTION_FINDER_REPOSITORY,
} from '../../constants';

/**
 * Legacy compatibility service - delegates to new domain services
 * @deprecated Use ReactionOperationService directly for new code
 */
@Injectable()
export class ReactionDomainService {
  constructor(
    private readonly operationService: ReactionOperationService,
    @Inject(REACTION_FINDER_REPOSITORY)
    private readonly finderRepository: IReactionFinderRepository,
  ) {}

  /**
   * @deprecated Use ReactionOperationService.processReaction instead
   */
  async createOrUpdateReaction(
    type: ReactionTypeEnum,
    reactorId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<{ reaction: ReactionEntity; isNew: boolean }> {
    const reactionType = ReactionType.create(type);
    const target = TargetType.create(targetType);

    const result = await this.operationService.processReaction(
      reactionType,
      reactorId,
      targetId,
      target,
    );

    return {
      reaction: result.reaction,
      isNew: result.isNew,
    };
  }

  /**
   * @deprecated Use ReactionOperationService.validateOwnership instead
   */
  async validateReactionOwnership(
    reactionId: string,
    userId: string,
  ): Promise<ReactionEntity> {
    return this.operationService.validateOwnership(reactionId, userId);
  }

  /**
   * @deprecated Use ReactionOperationService.removeReaction instead
   */
  async deleteReaction(reactionId: string, userId: string): Promise<void> {
    await this.operationService.removeReaction(reactionId, userId);
  }

  /**
   * Gets user reaction status for a target
   */
  async getUserReactionStatus(
    targetId: string,
    userId: string,
    targetType: 'post' | 'comment',
  ): Promise<{
    reacted: boolean;
    reactionType?: ReactionTypeEnum;
    reactionId?: string;
  }> {
    const target = TargetType.create(targetType);
    const reaction = await this.finderRepository.findByUserAndTarget(
      userId,
      targetId,
      target.getValue(),
    );

    if (!reaction) {
      return { reacted: false };
    }

    return {
      reacted: true,
      reactionType: reaction.type,
      reactionId: reaction.id,
    };
  }
}
