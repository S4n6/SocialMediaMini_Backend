import { Injectable, Inject } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentNotFoundException } from '../../domain/comment.exceptions';
import { CommentFactory } from '../../domain/factories/comment.factory';
import { CommentEntity } from '../../domain/comment.entity';

export interface UpdateCommentCommand {
  commentId: string;
  userId: string;
  content?: string;
}

@Injectable()
export class UpdateCommentUseCase {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(command: UpdateCommentCommand): Promise<CommentEntity> {
    const existingComment = await this.commentRepository.findById(
      command.commentId,
    );

    if (!existingComment) {
      throw new CommentNotFoundException(command.commentId);
    }

    // Authorization check - only comment author can update
    if (existingComment.authorId !== command.userId) {
      throw new Error('Unauthorized to update this comment');
    }

    const updatedComment = CommentFactory.updateComment(existingComment, {
      content: command.content ?? existingComment.content,
    });

    return await this.commentRepository.update(updatedComment);
  }
}
