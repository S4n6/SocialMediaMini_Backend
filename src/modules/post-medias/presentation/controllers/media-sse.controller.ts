import { Controller, Sse, UseGuards, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../../shared/decorators/currentUser.decorator';
import {
  MediaSseService,
  SseMessageEvent,
} from '../../infrastructure/services/media-sse.service';

/**
 * SSE endpoint for real-time media processing status updates.
 *
 * Clients connect to GET /post-medias/events/stream with a valid JWT.
 * They receive events when their media finishes processing (or fails).
 *
 * Event types:
 *   - media:processed  — media ready with processedUrl + thumbnailUrl
 *   - media:failed     — media processing failed with errorMessage
 */
@Controller('post-medias/events')
export class MediaSseController {
  private readonly logger = new Logger(MediaSseController.name);

  constructor(private readonly mediaSseService: MediaSseService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@CurrentUser('id') userId: string): Observable<SseMessageEvent> {
    this.logger.log(`User ${userId} connected to media SSE stream`);
    return this.mediaSseService.createStream(userId);
  }
}
