import { Injectable, Inject } from '@nestjs/common';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../../domain/repositories/post.repository';
import { PostDetailResponseDto } from '../dto/post.dto';
import {
  PostNotFoundException,
  UnauthorizedPostActionException,
} from '../../domain/exceptions/post.exceptions';
import { POST_REPOSITORY_TOKEN } from '../../constants';
import { mapPostToDetailResponseDto } from '../mappers/post-response.mapper';

/**
 * Use case for getting a single post by ID
 */
@Injectable()
export class GetPostByIdUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    viewerId?: string,
    isFollowing?: boolean,
  ): Promise<PostDetailResponseDto> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new PostNotFoundException(postId);
    }

    if (!this.postDomainService.canViewPost(post, viewerId, isFollowing)) {
      throw new UnauthorizedPostActionException('view this post');
    }

    return mapPostToDetailResponseDto(post);
  }
}
