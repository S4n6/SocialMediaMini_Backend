import { Injectable } from '@nestjs/common';
import { CommentDomainService } from '../../domain/services/comment-domain.service';
import { CommentEntity } from '../../domain/entities/comment.entity';

export interface UpdateCommentCommand {
  commentId: string;
  userId: string;
  content: string;
}

/**
 * Update Comment Use Case
 *
 * Responsibility: Orchestrate the update of an existing comment
 * - Validate command input
 * - Delegate to domain service for business logic and authorization
 * - Handle application-level concerns
 */
@Injectable()
export class UpdateCommentUseCase {
  constructor(private readonly commentDomainService: CommentDomainService) {}

  async execute(command: UpdateCommentCommand): Promise<CommentEntity> {
    // Input validation
    this.validateCommand(command);

    // Delegate to domain service for business logic
    const updatedComment = await this.commentDomainService.updateComment(
      command.commentId,
      command.content,
      command.userId,
    );

    // Application-level post-processing could go here

    return updatedComment;
  }

  private validateCommand(command: UpdateCommentCommand): void {
    if (!command.commentId?.trim()) {
      throw new Error('Comment ID is required');
    }
    if (!command.userId?.trim()) {
      throw new Error('User ID is required');
    }
    if (!command.content?.trim()) {
      throw new Error('Content is required');
    }
  }
}
