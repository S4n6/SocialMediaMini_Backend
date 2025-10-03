import { Injectable, Inject } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentNotFoundException } from '../../domain/comment.exceptions';

export interface DeleteCommentCommand {
  commentId: string;
  userId: string;
}

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const existingComment = await this.commentRepository.findById(
      command.commentId,
    );

    if (!existingComment) {
      throw new CommentNotFoundException(command.commentId);
    }

    // Authorization check - only comment author can delete
    if (existingComment.authorId !== command.userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Check if comment has replies - if so, use soft delete
    const repliesCount = await this.commentRepository.countRepliesByCommentId(
      command.commentId,
    );

    if (repliesCount > 0) {
      // Soft delete to preserve reply structure
      await this.commentRepository.softDelete(command.commentId);
    } else {
      // Hard delete if no replies
      await this.commentRepository.deleteById(command.commentId);
    }
  }
}
