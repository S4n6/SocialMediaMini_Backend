import { Injectable, Inject } from '@nestjs/common';
import { CommentDomainService } from '../../domain/services/comment-domain.service';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { COMMENT_TOKENS } from '../../constants';

export interface CreateCommentCommand {
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
}

/**
 * Create Comment Use Case
 *
 * Responsibility: Orchestrate the creation of a new comment
 * - Validate command input
 * - Delegate to domain service for business logic
 * - Handle application-level concerns (logging, metrics)
 */
@Injectable()
export class CreateCommentUseCase {
  constructor(
    @Inject(COMMENT_TOKENS.COMMENT_DOMAIN_SERVICE)
    private readonly commentDomainService: CommentDomainService,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentEntity> {
    // Input validation
    this.validateCommand(command);

    // Delegate to domain service for business logic
    const comment = await this.commentDomainService.createComment(
      command.content,
      command.authorId,
      command.postId,
      command.parentId,
    );

    // Application-level post-processing could go here (logging, events, etc.)

    return comment;
  }

  private validateCommand(command: CreateCommentCommand): void {
    if (!command.content?.trim()) {
      throw new Error('Content is required');
    }
    if (!command.authorId?.trim()) {
      throw new Error('Author ID is required');
    }
    if (!command.postId?.trim()) {
      throw new Error('Post ID is required');
    }
  }
}
