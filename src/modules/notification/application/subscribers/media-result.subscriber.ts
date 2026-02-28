import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import {
  NotificationType,
  NotificationEntityType,
} from '../../domain/enums/notification.enums';
import { MediaResultPayload } from '../../domain/value-objects/notification-payload.vo';

// ────────────────────────────────────────────────────────────
// Event shape — emitted when a RabbitMQ media-processing result
// is consumed by the NestJS backend (via webhook or direct consumer)
// ────────────────────────────────────────────────────────────

export interface MediaProcessedEvent {
  userId: string;
  mediaId: string;
  postId?: string;
  status: 'success' | 'failed';
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Converts media-processing results (RabbitMQ → EventEmitter2) into
 * persisted notifications pushed via SSE.
 */
@Injectable()
export class MediaResultSubscriber {
  private readonly logger = new Logger(MediaResultSubscriber.name);

  constructor(private readonly createNotification: CreateNotificationUseCase) {}

  @OnEvent('media.processed')
  async handle(event: MediaProcessedEvent): Promise<void> {
    const isSuccess = event.status === 'success';

    const metadata: MediaResultPayload = {
      kind: 'media_result',
      mediaId: event.mediaId,
      status: event.status,
      url: event.url,
      thumbnailUrl: event.thumbnailUrl,
      error: event.error,
    };

    try {
      await this.createNotification.execute({
        type: NotificationType.MEDIA_PROCESSED,
        title: isSuccess ? 'Media Ready' : 'Media Processing Failed',
        content: isSuccess
          ? 'Your media has been processed and is now available'
          : `Media processing failed: ${event.error ?? 'unknown error'}`,
        userId: event.userId,
        entityId: event.postId,
        entityType: event.postId ? NotificationEntityType.POST : undefined,
        metadata,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create media notification for user ${event.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
