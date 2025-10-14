import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import { PostService } from '../../ports/services/post.service';
import {
  PostMediaNotFoundException,
  UnauthorizedPostMediaActionException,
} from '../../../domain/post-media.exceptions';
import { POST_MEDIA_REPOSITORY, POST_SERVICE } from '../../../tokens';

export interface DeletePostMediaCommand {
  id: string;
  userId: string;
}

@Injectable()
export class DeletePostMediaUseCase {
  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
    @Inject(POST_SERVICE)
    private readonly postService: PostService,
  ) {}

  async execute(command: DeletePostMediaCommand): Promise<void> {
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
      throw new UnauthorizedPostMediaActionException('delete this post media');
    }

    // Delete the post media
    postMedia.delete(command.userId);
    await this.postMediaRepository.deleteById(command.id);
  }
}
