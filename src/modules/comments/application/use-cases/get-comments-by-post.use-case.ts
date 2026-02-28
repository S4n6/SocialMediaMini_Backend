import { Injectable, Inject } from '@nestjs/common';
import { ICommentRepository } from '../../domain/repositories/i-comment.repository';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { COMMENT_TOKENS } from '../../constants';

export interface GetCommentsByPostQuery {
  postId: string;
  page: number;
  limit: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

export interface GetCommentsByPostResult {
  items: CommentEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GetCommentsByPostUseCase {
  constructor(
    @Inject(COMMENT_TOKENS.COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(
    query: GetCommentsByPostQuery,
  ): Promise<GetCommentsByPostResult> {
    return await this.commentRepository.findTopLevelCommentsByPostId(
      query.postId,
      query.page,
      query.limit,
      query.sortBy,
    );
  }
}
