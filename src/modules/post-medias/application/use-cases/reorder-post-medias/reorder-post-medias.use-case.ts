import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import { PostService } from '../../ports/services/post.service';
import { POST_MEDIA_REPOSITORY, POST_SERVICE } from '../../../tokens';

export interface ReorderPostMediasCommand {
  postId: string;
  userId: string;
  newOrders: Array<{ id: string; order: number }>;
}

@Injectable()
export class ReorderPostMediasUseCase {
  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
    @Inject(POST_SERVICE)
    private readonly postService: PostService,
  ) {}

  async execute(command: ReorderPostMediasCommand): Promise<void> {
    // Validate post ownership
    const userOwnsPost = await this.postService.belongsToUser(
      command.postId,
      command.userId,
    );
    if (!userOwnsPost) {
      throw new Error('You can only reorder media on your own posts');
    }

    // Validate all media belong to the post
    const postMedias = await this.postMediaRepository.findByPostId(
      command.postId,
    );
    const postMediaIds = postMedias.map((media) => media.id);

    for (const orderItem of command.newOrders) {
      if (!postMediaIds.includes(orderItem.id)) {
        throw new Error(
          `Media with id ${orderItem.id} does not belong to post ${command.postId}`,
        );
      }
    }

    // Update orders
    await this.postMediaRepository.updateOrdersByPostId(
      command.postId,
      command.newOrders,
    );
  }
}
