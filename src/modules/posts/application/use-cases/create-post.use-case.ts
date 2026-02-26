import { Injectable, Inject } from '@nestjs/common';
import { PostFactory } from '../../domain/factories/post.factory';
import { IPostRepository } from '../../domain/repositories/post.repository';
import { POST_REPOSITORY_TOKEN } from '../../constants';
import { CreatePostDto, PostResponseDto } from '../dto/post.dto';
import { mapPostToResponseDto } from '../mappers/post-response.mapper';

/**
 * Use case for creating a new post
 */
@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postFactory: PostFactory,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
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
      hashtags: dto.hashtags,
      media: dto.media?.map((m) => ({
        url: m.url,
        type: m.type,
        order: m.order,
      })),
    });

    // Save post to repository
    const savedPost = await this.postRepository.save(post);

    return mapPostToResponseDto(savedPost);
  }
}
