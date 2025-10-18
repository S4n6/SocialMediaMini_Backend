import { Injectable, Inject } from '@nestjs/common';
import { PostEntity } from '../../domain/post.entity';
import { PostFactory } from '../../domain/factories/post.factory';
import { IPostRepository } from '../interfaces/post-repository.interface';
import { POST_REPOSITORY_TOKEN } from '../../constants';
import { CreatePostDto, PostResponseDto } from '../dto/post.dto';
import { CreatePostMediasFromUrlsUseCase } from '../../../post-medias/application/use-cases/create-post-medias-from-urls/create-post-medias-from-urls.use-case';
import {
  PostMediaType,
  PostMediaEntity,
} from '../../../post-medias/domain/post-media.entity';
import { PrismaService } from '../../../../database/prisma.service';
// Use literal token string to avoid circular import with PostsModule

/**
 * Use case for creating a new post
 */
@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postFactory: PostFactory,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    private readonly createPostMediasFromUrlsUseCase: CreatePostMediasFromUrlsUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Create post entity using factory (without media)
      const post = this.postFactory.createPost({
        content: dto.content,
        authorId,
        privacy: dto.privacy,
        hashtags: dto.hashtags,
        media: [], // Empty array for now, will be handled separately
      });

      // Save post to repository
      const savedPost = await this.postRepository.save(post);

      // Create post medias if provided
      let postMedias: PostMediaEntity[] = [];
      if (dto.media && dto.media.length > 0) {
        const mediaResult = await this.createPostMediasFromUrlsUseCase.execute({
          medias: dto.media.map((m) => ({
            url: m.url,
            type:
              m.type === 'image' ? PostMediaType.IMAGE : PostMediaType.VIDEO,
            order: m.order,
          })),
          postId: savedPost.id,
          userId: authorId,
        });
        postMedias = mediaResult.medias;
      }

      // Convert to response DTO with media
      return this.mapToResponseDto(savedPost, postMedias);
    });
  }

  private mapToResponseDto(
    post: PostEntity,
    postMedias: PostMediaEntity[] = [],
  ): PostResponseDto {
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
      media: postMedias.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        order: m.order,
      })),
      hashtags: post.hashtags,
      likesCount: 0, // New post has no reactions yet
      commentsCount: 0, // New post has no comments yet
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
