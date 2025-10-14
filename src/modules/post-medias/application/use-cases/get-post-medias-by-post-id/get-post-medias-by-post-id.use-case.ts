import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import { PostMediaEntity } from '../../../domain/post-media.entity';
import { POST_MEDIA_REPOSITORY } from '../../../tokens';

export interface GetPostMediasByPostIdQuery {
  postId: string;
}

@Injectable()
export class GetPostMediasByPostIdUseCase {
  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
  ) {}

  async execute(query: GetPostMediasByPostIdQuery): Promise<PostMediaEntity[]> {
    return await this.postMediaRepository.findByPostId(query.postId);
  }
}
