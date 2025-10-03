import { Injectable, Inject } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentNotFoundException } from '../../domain/comment.exceptions';
import { CommentFactory } from '../../domain/factories/comment.factory';
import { CommentEntity } from '../../domain/comment.entity';

export interface AddReactionCommand {
  commentId: string;
  userId: string;
  reactionType: string;
}

@Injectable()
export class AddReactionUseCase {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(command: AddReactionCommand): Promise<CommentEntity> {
    const comment = await this.commentRepository.findById(command.commentId);

    if (!comment) {
      throw new CommentNotFoundException(command.commentId);
    }

    // Validate reaction type
    const validReactionType = CommentFactory.validateReactionType(
      command.reactionType,
    );

    // Check if user already reacted with this type
    const hasReacted = await this.commentRepository.hasUserReacted(
      command.commentId,
      command.userId,
      validReactionType,
    );

    if (hasReacted) {
      throw new Error(`User already reacted with ${validReactionType}`);
    }

    // Add reaction through repository
    await this.commentRepository.addReaction(
      command.commentId,
      command.userId,
      validReactionType,
    );

    // Add domain event through entity
    comment.addReaction(command.userId, validReactionType);

    return comment;
  }
}
