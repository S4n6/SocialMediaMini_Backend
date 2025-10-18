import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../interfaces/post-repository.interface';
import { POST_REPOSITORY_TOKEN } from '../../constants';

/**
 * Use case for deleting a post
 */
@Injectable()
export class DeletePostUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    // Find existing post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Validate user permissions
    if (!this.postDomainService.canDeletePost(post, userId, userRole)) {
      throw new ForbiddenException(
        'You are not authorized to delete this post',
      );
    }

    // Delete the post
    await this.postRepository.delete(postId);
  }
}
