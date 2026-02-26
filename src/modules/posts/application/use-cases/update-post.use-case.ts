import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../../domain/repositories/post.repository';
import { PostNotFoundException } from '../../domain/exceptions/post.exceptions';
import { UpdatePostDto, PostResponseDto } from '../dto/post.dto';
import { POST_REPOSITORY_TOKEN } from '../../constants';
import { mapPostToResponseDto } from '../mappers/post-response.mapper';

/**
 * Use case for updating an existing post
 */
@Injectable()
export class UpdatePostUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    // Find existing post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new PostNotFoundException(postId);
    }

    // Validate user permissions
    this.postDomainService.validatePostEdit(post, userId);

    // Update post content if provided
    if (dto.content !== undefined) {
      const hashtags =
        dto.hashtags || this.postDomainService.extractHashtags(dto.content);
      post.updateContent(dto.content, hashtags);
    }

    // Update privacy if provided
    if (dto.privacy !== undefined) {
      post.changePrivacy(dto.privacy);
    }

    // Update media if provided
    if (dto.media !== undefined) {
      // Clear existing media and add new ones
      post.clearMedia();
      dto.media.forEach((mediaData) => {
        const media = {
          id: randomUUID(),
          url: mediaData.url,
          type: mediaData.type,
          order: mediaData.order,
        };
        post.addMedia(media);
      });
    }

    // Save updated post
    const updatedPost = await this.postRepository.save(post);

    return mapPostToResponseDto(updatedPost);
  }
}
