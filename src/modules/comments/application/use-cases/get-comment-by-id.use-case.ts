import { Injectable, Inject } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentNotFoundException } from '../../domain/exceptions/comment.exceptions';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { COMMENT_TOKENS } from '../../constants';

export interface GetCommentByIdQuery {
  commentId: string;
}

/**
 * Get Comment By ID Use Case
 *
 * Responsibility: Retrieve a single comment by its ID
 * - Validate query input
 * - Retrieve comment from repository
 * - Handle not found cases
 */
@Injectable()
export class GetCommentByIdUseCase {
  constructor(
    @Inject(COMMENT_TOKENS.COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(query: GetCommentByIdQuery): Promise<CommentEntity> {
    // Input validation
    this.validateQuery(query);

    // Retrieve comment
    const comment = await this.commentRepository.findById(query.commentId);

    if (!comment) {
      throw new CommentNotFoundException(query.commentId);
    }

    return comment;
  }

  private validateQuery(query: GetCommentByIdQuery): void {
    if (!query.commentId?.trim()) {
      throw new Error('Comment ID is required');
    }
  }
}
