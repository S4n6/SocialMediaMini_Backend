import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../interfaces/post-repository.interface';
import {
  GetPostsQueryDto,
  PostResponseDto,
  PostListResponseDto,
  PostDetailResponseDto,
} from '../dto/post.dto';
import { PostEntity } from '../../domain/post.entity';
import { POST_REPOSITORY_TOKEN } from '../../constants';

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
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if user can view this post
    if (!this.postDomainService.canViewPost(post, viewerId, isFollowing)) {
      throw new ForbiddenException('You are not authorized to view this post');
    }

    // Convert to response DTO with detailed information
    return this.mapToDetailResponseDto(post);
  }

  private mapToDetailResponseDto(post: PostEntity): PostDetailResponseDto {
    return {
      id: post.id,
      content: post.content,
      privacy: post.privacy,
      author: {
        id: post.authorId,
        fullName: '', // Will be populated by application service
        username: '',
        avatar: undefined,
      },
      media: post.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        order: m.order,
      })),
      hashtags: post.hashtags,
      likesCount: post.reactions.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId,
        authorFullName: '', // Will be populated by application service
        authorAvatar: undefined,
        parentId: c.parentId,
        repliesCount: 0, // Will be calculated by application service
        likesCount: 0, // Will be calculated by application service
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      reactions: post.reactions.map((r) => ({
        id: r.id,
        type: r.type,
        userId: r.userId,
        userFullName: '', // Will be populated by application service
        userAvatar: undefined,
        createdAt: r.createdAt,
      })),
    };
  }
}

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
    // Get posts from repository
    const { posts, total } = await this.postRepository.findAll({
      authorId: query.authorId,
      privacy: query.privacy,
      hashtag: query.hashtag,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'newest',
    });

    // Filter posts based on privacy and user permissions
    const visiblePosts = posts.filter((post) =>
      this.postDomainService.canViewPost(post, viewerId),
    );

    // Convert to response DTOs
    const postDtos = visiblePosts.map((post) => this.mapToResponseDto(post));

    // Calculate pagination
    const totalPages = Math.ceil(total / (query.limit || 10));
    const currentPage = query.page || 1;

    return {
      posts: postDtos,
      total,
      page: currentPage,
      limit: query.limit || 10,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  private mapToResponseDto(post: PostEntity): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      privacy: post.privacy,
      author: {
        id: post.authorId,
        fullName: '', // Will be populated by application service
        username: '',
        avatar: undefined,
      },
      media: post.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        order: m.order,
      })),
      hashtags: post.hashtags,
      likesCount: post.reactions.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}

/**
 * Use case for getting user's timeline feed
 */
@Injectable()
export class GetTimelineFeedUseCase {
  constructor(
    @Inject('POST_REPOSITORY')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PostListResponseDto> {
    // Get timeline feed from repository
    const { posts, total } = await this.postRepository.getTimelineFeed(
      userId,
      page,
      limit,
    );

    // Convert to response DTOs
    const postDtos = posts.map((post) => this.mapToResponseDto(post));

    // Calculate pagination
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

  private mapToResponseDto(post: PostEntity): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      privacy: post.privacy,
      author: {
        id: post.authorId,
        fullName: '', // Will be populated by application service
        username: '',
        avatar: undefined,
      },
      media: post.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        order: m.order,
      })),
      hashtags: post.hashtags,
      likesCount: post.reactions.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
