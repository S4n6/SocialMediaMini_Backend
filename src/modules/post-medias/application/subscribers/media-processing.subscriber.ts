import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { POST_SERVICE } from '../../tokens';
import { PostService } from '../../domain/services/post.service';
import {
  MediaProcessedEvent,
  MediaProcessingFailedEvent,
} from '../../domain/post-media.events';
import {
  MediaSseService,
  MediaSseEventType,
} from '../../infrastructure/services/media-sse.service';

/**
 * Subscribes to domain events emitted by CompleteMediaProcessingUseCase
 * and pushes real-time SSE updates to the post owner.
 *
 * Side-effect handler — keeps use cases clean of delivery concerns.
 */
@Injectable()
export class MediaProcessingSubscriber {
  private readonly logger = new Logger(MediaProcessingSubscriber.name);

  constructor(
    @Inject(POST_SERVICE)
    private readonly postService: PostService,
    private readonly mediaSseService: MediaSseService,
  ) {}

  @OnEvent('MediaProcessed')
  async onMediaProcessed(event: MediaProcessedEvent): Promise<void> {
    const userId = await this.resolveOwner(event.postId);
    if (!userId) return;

    this.mediaSseService.pushEvent(userId, {
      type: MediaSseEventType.MEDIA_PROCESSED,
      mediaId: event.mediaId,
      postId: event.postId,
      processedUrl: event.processedUrl,
      thumbnailUrl: event.thumbnailUrl,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `SSE pushed media:processed → user ${userId}, media ${event.mediaId}`,
    );
  }

  @OnEvent('MediaProcessingFailed')
  async onMediaProcessingFailed(
    event: MediaProcessingFailedEvent,
  ): Promise<void> {
    const userId = await this.resolveOwner(event.postId);
    if (!userId) return;

    this.mediaSseService.pushEvent(userId, {
      type: MediaSseEventType.MEDIA_FAILED,
      mediaId: event.mediaId,
      postId: event.postId,
      errorMessage: event.errorMessage,
      timestamp: new Date().toISOString(),
    });

    this.logger.warn(
      `SSE pushed media:failed → user ${userId}, media ${event.mediaId}`,
    );
  }

  /**
   * Resolve the post owner. If the post doesn't exist (edge case),
   * log a warning and skip the push — no point notifying nobody.
   */
  private async resolveOwner(postId: string): Promise<string | null> {
    const userId = await this.postService.getOwnerUserId(postId);
    if (!userId) {
      this.logger.warn(
        `Cannot push SSE — post ${postId} owner not found (deleted?)`,
      );
    }
    return userId;
  }
}
