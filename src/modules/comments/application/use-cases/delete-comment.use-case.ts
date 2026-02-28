import { Injectable, Inject } from '@nestjs/common';
import { CommentDomainService } from '../../domain/services/comment-domain.service';
import { COMMENT_TOKENS } from '../../constants';

export interface DeleteCommentCommand {
  commentId: string;
  userId: string;
}

/**
 * Delete Comment Use Case
 *
 * Responsibility: Orchestrate the deletion of a comment
 * - Validate command input
 * - Delegate to domain service for business logic and authorization
 * - Handle application-level concerns
 */
@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject(COMMENT_TOKENS.COMMENT_DOMAIN_SERVICE)
    private readonly commentDomainService: CommentDomainService,
  ) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    // Input validation
    this.validateCommand(command);

    // Delegate to domain service for business logic
    await this.commentDomainService.deleteComment(
      command.commentId,
      command.userId,
    );

    // Application-level post-processing could go here
  }

  private validateCommand(command: DeleteCommentCommand): void {
    if (!command.commentId?.trim()) {
      throw new Error('Comment ID is required');
    }
    if (!command.userId?.trim()) {
      throw new Error('User ID is required');
    }
  }
}
