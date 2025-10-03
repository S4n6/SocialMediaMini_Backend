import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../domain/repositories/post-media.repository';
import { PostMediaEntity } from '../../domain/post-media.entity';

export interface GetAllPostMediasQuery {
  page: number;
  limit: number;
}

export interface GetAllPostMediasResult {
  items: PostMediaEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GetAllPostMediasUseCase {
  constructor(
    @Inject('POST_MEDIA_REPOSITORY')
    private readonly postMediaRepository: PostMediaRepository,
  ) {}

  async execute(query: GetAllPostMediasQuery): Promise<GetAllPostMediasResult> {
    const result = await this.postMediaRepository.findWithPagination(
      query.page,
      query.limit,
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
