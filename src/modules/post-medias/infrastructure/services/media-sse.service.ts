import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * Event types pushed over SSE to the client.
 */
export enum MediaSseEventType {
  MEDIA_PROCESSED = 'media:processed',
  MEDIA_FAILED = 'media:failed',
}

/**
 * Shape of an SSE media event payload.
 */
export interface MediaSseEventPayload {
  type: MediaSseEventType;
  mediaId: string;
  postId: string;
  processedUrl?: string;
  thumbnailUrl?: string | null;
  errorMessage?: string;
  timestamp: string;
}

/**
 * SSE MessageEvent shape expected by NestJS @Sse() decorator.
 */
export interface SseMessageEvent {
  data: string | object;
  type?: string;
  id?: string;
  retry?: number;
}

/**
 * Manages per-user SSE streams for media processing status updates.
 *
 * Pattern:
 *   - A single global Subject emits all media events (tagged with userId).
 *   - Each client subscription filters to only their userId.
 *   - When the client disconnects, the Observable completes naturally.
 */
@Injectable()
export class MediaSseService implements OnModuleDestroy {
  private readonly logger = new Logger(MediaSseService.name);

  /**
   * Global event bus — every media event from every user flows through here.
   * Subscribers filter by userId.
   */
  private readonly eventBus$ = new Subject<{
    userId: string;
    event: MediaSseEventPayload;
  }>();

  /**
   * Create an Observable that a client subscribes to via SSE.
   * Only events for the given userId are forwarded.
   */
  createStream(userId: string): Observable<SseMessageEvent> {
    this.logger.log(`SSE stream opened for user ${userId}`);

    return this.eventBus$.asObservable().pipe(
      filter((envelope) => envelope.userId === userId),
      map((envelope) => ({
        data: envelope.event,
        type: envelope.event.type,
        id: `${envelope.event.mediaId}-${Date.now()}`,
      })),
    );
  }

  /**
   * Push a media processing event to the target user's SSE stream.
   */
  pushEvent(userId: string, event: MediaSseEventPayload): void {
    this.eventBus$.next({ userId, event });
    this.logger.debug(
      `SSE event pushed: ${event.type} for user ${userId}, media ${event.mediaId}`,
    );
  }

  onModuleDestroy(): void {
    this.eventBus$.complete();
    this.logger.log('MediaSseService destroyed, event bus completed');
  }
}
