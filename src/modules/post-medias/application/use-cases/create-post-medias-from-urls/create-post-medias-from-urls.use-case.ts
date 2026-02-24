import { Inject, Injectable, Logger } from '@nestjs/common';
import { POST_MEDIA_REPOSITORY } from '../../../tokens';
import { PostMediaRepository } from '../../../domain/repositories/post-media.repository';
import {
  PostMediaEntity,
  PostMediaType,
} from '../../../domain/post-media.entity';
import { CreatePostMediasFromUrlsCommand } from './create-post-medias-from-urls.command';
import { CreatePostMediasFromUrlsResponse } from './create-post-medias-from-urls.response';
import {
  TooManyMediaFilesException,
  InvalidPostMediaException,
} from '../../../domain/post-media.exceptions';
import { IMessagePublisher } from '../../../../../infrastructure/message-queue/ports/i-message-publisher.port';
import {
  MESSAGE_PUBLISHER_TOKEN,
  TASK_TYPE_PROCESS_MEDIA,
} from '../../../../../infrastructure/message-queue/message-queue.constants';
import type { ProcessMediaMessage } from '../../ports/process-media.message';

@Injectable()
export class CreatePostMediasFromUrlsUseCase {
  private readonly logger = new Logger(CreatePostMediasFromUrlsUseCase.name);

  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
    @Inject(MESSAGE_PUBLISHER_TOKEN)
    private readonly publisher: IMessagePublisher,
  ) {}

  async execute(
    command: CreatePostMediasFromUrlsCommand,
  ): Promise<CreatePostMediasFromUrlsResponse> {
    const { medias, postId, userId, maxMediaPerPost = 10 } = command;

    // Validate maximum number of media files
    if (medias.length > maxMediaPerPost) {
      throw new TooManyMediaFilesException(
        `Maximum ${maxMediaPerPost} media files allowed per post`,
      );
    }

    // Get existing medias for the post to check total count
    const existingMedias = await this.postMediaRepository.findByPostId(postId);
    const totalAfterCreation = existingMedias.length + medias.length;

    if (totalAfterCreation > maxMediaPerPost) {
      throw new TooManyMediaFilesException(
        `Total media files would exceed maximum of ${maxMediaPerPost}. Current: ${existingMedias.length}, Adding: ${medias.length}`,
      );
    }

    // Validate URLs and types
    this.validateMediaInputs(medias);

    // Determine the starting order for new medias
    const maxExistingOrder =
      existingMedias.length > 0
        ? Math.max(...existingMedias.map((m) => m.order))
        : 0;

    // Create PostMediaEntity instances
    const postMediaEntities = medias.map((media, index) => {
      const order = media.order || maxExistingOrder + index + 1;

      return new PostMediaEntity({
        url: media.url,
        type: media.type,
        postId,
        order,
        s3Key: media.s3Key,
      });
    });

    // Save all medias in a batch
    const savedMedias =
      await this.postMediaRepository.saveMany(postMediaEntities);

    // Publish processing tasks to the worker queue
    await this.publishProcessingTasks(savedMedias, medias, userId);

    return {
      medias: savedMedias,
      totalCreated: savedMedias.length,
    };
  }

  /**
   * Publish a `process_media` message per saved media item.
   * Non-critical: if publishing fails for one item, log the error
   * but don't fail the entire request.
   */
  private async publishProcessingTasks(
    savedMedias: PostMediaEntity[],
    inputMedias: CreatePostMediasFromUrlsCommand['medias'],
    userId: string,
  ): Promise<void> {
    for (let i = 0; i < savedMedias.length; i++) {
      const media = savedMedias[i];
      const s3Key = inputMedias[i].s3Key;

      const message: ProcessMediaMessage = {
        type: TASK_TYPE_PROCESS_MEDIA as 'process_media',
        payload: {
          media_id: media.id,
          post_id: media.postId,
          s3_key: s3Key,
          media_type: media.type,
          user_id: userId,
        },
      };

      try {
        await this.publisher.publish(message);
        this.logger.log(
          `Published process_media task for media ${media.id} (${media.type})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to publish process_media task for media ${media.id}`,
          error,
        );
      }
    }
  }

  private validateMediaInputs(
    medias: {
      url: string;
      type: PostMediaType;
      order?: number;
      s3Key: string;
    }[],
  ): void {
    for (const media of medias) {
      // Validate S3 key
      if (!media.s3Key || media.s3Key.trim() === '') {
        throw new InvalidPostMediaException(
          'S3 key is required for each media item',
        );
      }

      // Validate URL format
      try {
        new URL(media.url);
      } catch {
        throw new InvalidPostMediaException(`Invalid URL format: ${media.url}`);
      }

      // Validate media type
      if (!Object.values(PostMediaType).includes(media.type)) {
        throw new InvalidPostMediaException(
          `Invalid media type: ${media.type}. Must be one of: ${Object.values(PostMediaType).join(', ')}`,
        );
      }

      // Validate order if provided
      if (media.order !== undefined && (media.order < 1 || media.order > 10)) {
        throw new InvalidPostMediaException(
          `Invalid order: ${media.order}. Must be between 1 and 10`,
        );
      }
    }

    // Check for duplicate orders if any orders are specified
    const specifiedOrders = medias
      .filter((m) => m.order !== undefined)
      .map((m) => m.order!);

    const uniqueOrders = new Set(specifiedOrders);
    if (specifiedOrders.length !== uniqueOrders.size) {
      throw new InvalidPostMediaException(
        'Duplicate order values are not allowed',
      );
    }
  }
}
