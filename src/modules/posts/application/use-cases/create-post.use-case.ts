import { Injectable, Inject } from '@nestjs/common';
import { PostFactory } from '../../domain/factories/post.factory';
import { IPostRepository } from '../../domain/repositories/post.repository';
import { PostStatus } from '../../domain/entities/post.entity';
import { POST_REPOSITORY_TOKEN } from '../../constants';
import { CreatePostDto, PostResponseDto } from '../dto/post.dto';
import { mapPostToResponseDto } from '../mappers/post-response.mapper';
import { IMessagePublisher } from '../../../../infrastructure/message-queue/ports/i-message-publisher.port';
import {
  MESSAGE_PUBLISHER_TOKEN,
  TASK_TYPE_PROCESS_MEDIA,
} from '../../../../infrastructure/message-queue/message-queue.constants';

/**
 * Use case for creating a new post.
 *
 * When media is attached the post is persisted with status PROCESSING
 * and a `process_media` message is published to RabbitMQ for the Go
 * worker. The response is returned immediately so the client can
 * render an optimistic placeholder.
 */
@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postFactory: PostFactory,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
    @Inject(MESSAGE_PUBLISHER_TOKEN)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const hasMedia = dto.media && dto.media.length > 0;

    // Create post entity – PROCESSING when media needs worker processing
    const post = this.postFactory.createPost({
      content: dto.content,
      authorId,
      privacy: dto.privacy,
      status: hasMedia ? PostStatus.PROCESSING : PostStatus.PUBLISHED,
      hashtags: dto.hashtags,
      media: dto.media?.map((m) => ({
        url: m.url,
        type: m.type,
        order: m.order,
      })),
    });

    // Persist – returns the fully hydrated entity
    const savedPost = await this.postRepository.save(post);

    // Publish one RabbitMQ message per media item for the Go worker
    if (hasMedia && dto.media) {
      const publishPromises = dto.media.map((m) =>
        this.messagePublisher.publish({
          type: TASK_TYPE_PROCESS_MEDIA,
          payload: {
            media_id: m.s3Key || m.url, // fallback to URL when no S3 key
            post_id: savedPost.id,
            s3_key: m.s3Key || '',
            media_type: m.type,
            user_id: authorId,
          },
        }),
      );
      await Promise.all(publishPromises);
    }

    return mapPostToResponseDto(savedPost);
  }
}
