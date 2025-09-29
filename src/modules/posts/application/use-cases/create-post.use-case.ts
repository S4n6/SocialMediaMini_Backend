import { Injectable, Inject } from '@nestjs/common';
import { PostEntity } from '../../domain/post.entity';
import { PostFactory } from '../../domain/factories/post.factory';
import { IPostDomainRepository } from '../../domain/repositories/post-domain-repository.interface';
import { CreatePostDto, PostResponseDto } from '../dto/post.dto';

export const POST_REPOSITORY_TOKEN = 'POST_REPOSITORY';

/**
 * Use case for creating a new post
 */
@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postFactory: PostFactory,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostDomainRepository,
  ) {}

  async execute(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    // Create post entity using factory
    const post = this.postFactory.createPost({
      content: dto.content,
      authorId,
      privacy: dto.privacy,
      media: dto.media,
      hashtags: dto.hashtags,
    });

    // Save to repository
    const savedPost = await this.postRepository.save(post);

    // Convert to response DTO
    return this.mapToResponseDto(savedPost);
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
