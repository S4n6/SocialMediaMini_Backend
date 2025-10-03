import { Injectable, Inject } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentEntity } from '../../domain/comment.entity';

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
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: CommentRepository,
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
