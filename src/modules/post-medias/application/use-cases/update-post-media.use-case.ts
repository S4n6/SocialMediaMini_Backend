import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../domain/repositories/post-media.repository';
import { PostMediaEntity } from '../../domain/post-media.entity';
import {
  PostMediaNotFoundException,
  UnauthorizedPostMediaActionException,
} from '../../domain/post-media.exceptions';
import { PostService } from '../../domain/services/post-media-domain.service';

export interface UpdatePostMediaCommand {
  id: string;
  userId: string;
  url?: string;
  order?: number;
}

@Injectable()
export class UpdatePostMediaUseCase {
  constructor(
    @Inject('POST_MEDIA_REPOSITORY')
    private readonly postMediaRepository: PostMediaRepository,
    @Inject('POST_SERVICE')
    private readonly postService: PostService,
  ) {}

  async execute(command: UpdatePostMediaCommand): Promise<PostMediaEntity> {
    // Find the post media
    const postMedia = await this.postMediaRepository.findById(command.id);

    if (!postMedia) {
      throw new PostMediaNotFoundException(command.id);
    }

    // Check if user owns the post
    const userOwnsPost = await this.postService.belongsToUser(
      postMedia.postId,
      command.userId,
    );
    if (!userOwnsPost) {
      throw new UnauthorizedPostMediaActionException('update this post media');
    }

    // Update properties if provided
    if (command.url !== undefined) {
      postMedia.updateUrl(command.url, command.userId);
    }

    if (command.order !== undefined) {
      postMedia.updateOrder(command.order, command.userId);
    }

    // Save and return updated entity
    return await this.postMediaRepository.save(postMedia);
  }
}
