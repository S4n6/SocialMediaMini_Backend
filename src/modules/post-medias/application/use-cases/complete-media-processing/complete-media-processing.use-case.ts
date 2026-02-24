import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { POST_MEDIA_REPOSITORY } from '../../../tokens';
import { PostMediaRepository } from '../../../domain/repositories/post-media.repository';
import { PostMediaNotFoundException } from '../../../domain/post-media.exceptions';
import { PostMediaEntity } from '../../../domain/post-media.entity';
import { CompleteMediaProcessingCommand } from './complete-media-processing.command';

/**
 * Handles the callback from the Go worker after media processing.
 *
 * Flow:
 *   1. Load the PostMedia entity from the database
 *   2. Transition its status (markReady or markFailed)
 *   3. Persist the updated entity
 *   4. Publish domain events (MediaProcessedEvent / MediaProcessingFailedEvent)
 *
 * Domain events can be consumed by subscribers for:
 *   - WebSocket push to the client  (Stage 5)
 *   - Cache invalidation
 *   - Analytics / logging
 */
@Injectable()
export class CompleteMediaProcessingUseCase {
  private readonly logger = new Logger(CompleteMediaProcessingUseCase.name);

  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepo: PostMediaRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: CompleteMediaProcessingCommand): Promise<void> {
    const { mediaId, status, processedUrl, thumbnailUrl, errorMessage } =
      command;

    // 1. Load entity
    const media = await this.postMediaRepo.findById(mediaId);
    if (!media) {
      throw new PostMediaNotFoundException(mediaId);
    }

    // 2. Transition status — the entity enforces valid transitions
    if (status === 'success') {
      media.markReady(processedUrl!, thumbnailUrl ?? null);
      this.logger.log(
        `Media ${mediaId} processed successfully → ${processedUrl}`,
      );
    } else {
      media.markFailed(errorMessage || 'Unknown worker error');
      this.logger.warn(`Media ${mediaId} processing failed: ${errorMessage}`);
    }

    // 3. Persist
    await this.postMediaRepo.save(media);

    // 4. Publish domain events for subscribers
    const domainEvents = media.domainEvents;
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventType, event);
    }
    media.clearEvents();
  }
}
