import { Injectable } from '@nestjs/common';
import { ReactionEntity } from '../entities/reaction.entity';
import { ReactionType, TargetType } from '../value-objects';
import { REACTION_BUSINESS_RULES } from '../../constants';

/**
 * Domain service for reaction business rules and validation
 * Pure domain logic without external dependencies
 */
@Injectable()
export class ReactionBusinessRulesService {
  /**
   * Validates if a user can react to a target
   */
  canUserReactToTarget(
    reactorId: string,
    targetAuthorId: string,
    reactionType: ReactionType,
  ): { canReact: boolean; reason?: string } {
    // Business rule: User can react to their own content (self-reactions allowed)
    // Business rule: All reaction types are allowed for all targets
    return { canReact: true };
  }

  /**
   * Determines if existing reaction should be updated or removed
   */
  shouldUpdateExistingReaction(
    existingReaction: ReactionEntity,
    newReactionType: ReactionType,
  ): { action: 'update' | 'remove' | 'none'; reason: string } {
    const currentType = ReactionType.create(existingReaction.type);

    if (currentType.equals(newReactionType)) {
      return {
        action: 'remove',
        reason: 'Same reaction type - toggle off',
      };
    }

    return {
      action: 'update',
      reason: 'Different reaction type - update',
    };
  }

  /**
   * Validates business constraints
   */
  validateReactionConstraints(
    reactorId: string,
    targetId: string,
    targetType: TargetType,
    reactionType: ReactionType,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate target type
    if (!targetType.isPost() && !targetType.isComment()) {
      errors.push('Invalid target type');
    }

    // Validate reactor ID
    if (!reactorId || reactorId.trim().length === 0) {
      errors.push('Reactor ID is required');
    }

    // Validate target ID
    if (!targetId || targetId.trim().length === 0) {
      errors.push('Target ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets the maximum allowed reactions per user per target
   */
  getMaxReactionsPerUserPerTarget(): number {
    return REACTION_BUSINESS_RULES.MAX_REACTIONS_PER_USER_PER_TARGET;
  }
}
