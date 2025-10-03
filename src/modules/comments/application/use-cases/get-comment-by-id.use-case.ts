import { Injectable, Inject } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentNotFoundException } from '../../domain/comment.exceptions';
import { CommentEntity } from '../../domain/comment.entity';

export interface GetCommentByIdQuery {
  commentId: string;
}

@Injectable()
export class GetCommentByIdUseCase {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(query: GetCommentByIdQuery): Promise<CommentEntity> {
    const comment = await this.commentRepository.findById(query.commentId);

    if (!comment) {
      throw new CommentNotFoundException(query.commentId);
    }

    return comment;
  }
}
