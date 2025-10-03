import { Injectable } from '@nestjs/common';
import { ReactionEntity, ReactionType } from '../reaction.entity';
import { ReactionRepository } from '../repositories/reaction.repository';
import {
  ReactionNotFoundException,
  UnauthorizedReactionException,
} from '../reaction.exceptions';

@Injectable()
export class ReactionDomainService {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async createOrUpdateReaction(
    type: ReactionType,
    reactorId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<{ reaction: ReactionEntity; isNew: boolean }> {
    // Check if user already has a reaction to this target
    const existingReaction = await this.reactionRepository.findByUserAndTarget(
      reactorId,
      targetId,
      targetType,
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.updateType(type);
      const updatedReaction =
        await this.reactionRepository.save(existingReaction);
      return { reaction: updatedReaction, isNew: false };
    }

    // Create new reaction
    const newReaction = ReactionEntity.createNew(
      type,
      reactorId,
      targetId,
      targetType,
    );
    const savedReaction = await this.reactionRepository.save(newReaction);
    return { reaction: savedReaction, isNew: true };
  }

  async validateReactionOwnership(
    reactionId: string,
    userId: string,
  ): Promise<ReactionEntity> {
    const reaction = await this.reactionRepository.findById(reactionId);

    if (!reaction) {
      throw new ReactionNotFoundException(reactionId);
    }

    if (!reaction.isOwnedBy(userId)) {
      throw new UnauthorizedReactionException();
    }

    return reaction;
  }

  async deleteReaction(reactionId: string, userId: string): Promise<void> {
    await this.validateReactionOwnership(reactionId, userId);
    await this.reactionRepository.delete(reactionId);
  }

  async getUserReactionStatus(
    targetId: string,
    userId: string,
    targetType: 'post' | 'comment',
  ): Promise<{
    reacted: boolean;
    reactionType?: ReactionType;
    reactionId?: string;
  }> {
    const reaction = await this.reactionRepository.findByUserAndTarget(
      userId,
      targetId,
      targetType,
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

  async validateTargetExists(
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<void> {
    // This method should be implemented with proper validation
    // For now, we'll assume the validation happens at the application layer
    // through the use of external services
  }
}
