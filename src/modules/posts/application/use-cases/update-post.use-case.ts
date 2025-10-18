import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostEntity } from '../../domain/post.entity';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../interfaces/post-repository.interface';
import { UpdatePostDto, PostResponseDto } from '../dto/post.dto';
import { POST_REPOSITORY_TOKEN } from '../../constants';
// Use literal token string to avoid circular import with PostsModule

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
      throw new NotFoundException(`Post with ID ${postId} not found`);
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

    // Convert to response DTO
    return this.mapToResponseDto(updatedPost);
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
