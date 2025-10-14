import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import { PostMediaEntity } from '../../../domain/post-media.entity';
import { PostMediaNotFoundException } from '../../../domain/post-media.exceptions';
import { POST_MEDIA_REPOSITORY } from '../../../tokens';

export interface GetPostMediaByIdQuery {
  id: string;
}

@Injectable()
export class GetPostMediaByIdUseCase {
  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
  ) {}

  async execute(query: GetPostMediaByIdQuery): Promise<PostMediaEntity> {
    const postMedia = await this.postMediaRepository.findById(query.id);

    if (!postMedia) {
      throw new PostMediaNotFoundException(query.id);
    }

    return postMedia;
  }
}
