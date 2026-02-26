import { Injectable, Inject } from '@nestjs/common';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../../domain/repositories/post.repository';
import { GetPostsQueryDto, PostListResponseDto } from '../dto/post.dto';
import { POST_REPOSITORY_TOKEN } from '../../constants';
import { mapPostToResponseDto } from '../mappers/post-response.mapper';

/**
 * Use case for getting multiple posts with filters
 */
@Injectable()
export class GetPostsUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    query: GetPostsQueryDto,
    viewerId?: string,
  ): Promise<PostListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const { posts, total } = await this.postRepository.findAll({
      authorId: query.authorId,
      privacy: query.privacy,
      hashtag: query.hashtag,
      search: query.search,
      page,
      limit,
      sortBy: query.sortBy || 'newest',
    });

    // Filter posts based on privacy and user permissions
    const visiblePosts = posts.filter((post) =>
      this.postDomainService.canViewPost(post, viewerId),
    );

    const postDtos = visiblePosts.map(mapPostToResponseDto);
    const totalPages = Math.ceil(total / limit);

    return {
      posts: postDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
