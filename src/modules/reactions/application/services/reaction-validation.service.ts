import { Injectable, Logger } from '@nestjs/common';
import { ReactionEntity } from '../../domain/entities/reaction.entity';
import { ReactionType, TargetType } from '../../domain/value-objects';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ReactionValidationContext {
  reactorId: string;
  targetId: string;
  targetType: TargetType;
  reactionType: ReactionType;
  existingReaction?: ReactionEntity;
}

/**
 * Application service for validation logic
 * Handles validation that spans multiple domain boundaries
 */
@Injectable()
export class ReactionValidationService {
  private readonly logger = new Logger(ReactionValidationService.name);

  /**
   * Validates a reaction creation/update request
   */
  async validateReactionRequest(
    context: ReactionValidationContext,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!context.reactorId?.trim()) {
      errors.push('Reactor ID is required');
    }

    if (!context.targetId?.trim()) {
      errors.push('Target ID is required');
    }

    // Business rule validation
    if (context.existingReaction) {
      const currentType = ReactionType.create(context.existingReaction.type);
      if (currentType.equals(context.reactionType)) {
        warnings.push('Same reaction type will toggle the reaction off');
      }
    }

    // Rate limiting validation (example)
    const rateLimit = await this.checkRateLimit(context.reactorId);
    if (!rateLimit.allowed) {
      errors.push(
        `Rate limit exceeded. Try again in ${rateLimit.resetTime} seconds`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validates bulk operations
   */
  async validateBulkOperation(contexts: ReactionValidationContext[]): Promise<{
    validItems: ReactionValidationContext[];
    invalidItems: Array<{
      context: ReactionValidationContext;
      errors: string[];
    }>;
  }> {
    const validItems: ReactionValidationContext[] = [];
    const invalidItems: Array<{
      context: ReactionValidationContext;
      errors: string[];
    }> = [];

    for (const context of contexts) {
      const validation = await this.validateReactionRequest(context);
      if (validation.isValid) {
        validItems.push(context);
      } else {
        invalidItems.push({
          context,
          errors: validation.errors,
        });
      }
    }

    return { validItems, invalidItems };
  }

  private async checkRateLimit(
    userId: string,
  ): Promise<{ allowed: boolean; resetTime?: number }> {
    // Implementation would check Redis/cache for rate limiting
    // For now, always allow
    return { allowed: true };
  }
}
