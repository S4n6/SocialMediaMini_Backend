import { Injectable } from '@nestjs/common';
import { CommentDomainService } from '../../domain/services/comment-domain.service';
import { ReactionType } from '../../domain/entities/comment.entity';

export interface AddReactionCommand {
  commentId: string;
  userId: string;
  reactionType: string;
}

/**
 * Add Reaction Use Case
 *
 * Responsibility: Orchestrate adding a reaction to a comment
 * - Validate command input
 * - Delegate to domain service for business logic
 * - Handle application-level concerns
 */
@Injectable()
export class AddReactionUseCase {
  constructor(private readonly commentDomainService: CommentDomainService) {}

  async execute(command: AddReactionCommand): Promise<void> {
    // Input validation
    this.validateCommand(command);

    // Delegate to domain service for business logic
    await this.commentDomainService.addReaction(
      command.commentId,
      command.userId,
      command.reactionType as ReactionType,
    );

    // Application-level post-processing could go here
  }

  private validateCommand(command: AddReactionCommand): void {
    if (!command.commentId?.trim()) {
      throw new Error('Comment ID is required');
    }
    if (!command.userId?.trim()) {
      throw new Error('User ID is required');
    }
    if (!command.reactionType?.trim()) {
      throw new Error('Reaction type is required');
    }

    // Validate reaction type enum
    const validReactionTypes = ['like', 'love', 'laugh', 'angry', 'sad'];
    if (!validReactionTypes.includes(command.reactionType.toLowerCase())) {
      throw new Error(
        `Invalid reaction type. Must be one of: ${validReactionTypes.join(', ')}`,
      );
    }
  }
}
