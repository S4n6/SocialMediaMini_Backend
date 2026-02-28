import { Injectable, Inject } from '@nestjs/common';
import { ICommentRepository } from '../../domain/repositories/i-comment.repository';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { COMMENT_TOKENS } from '../../constants';

export interface GetRepliesQuery {
  commentId: string;
  page: number;
  limit: number;
}

export interface GetRepliesResult {
  items: CommentEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GetRepliesUseCase {
  constructor(
    @Inject(COMMENT_TOKENS.COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
  ) {}

  async execute(query: GetRepliesQuery): Promise<GetRepliesResult> {
    // Validate pagination parameters
    const page = Math.max(1, query.page);
    const limit = Math.min(Math.max(1, query.limit), 100); // Max 100 items per page

    const result = await this.commentRepository.findRepliesByCommentId(
      query.commentId,
      page,
      limit,
    );

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
