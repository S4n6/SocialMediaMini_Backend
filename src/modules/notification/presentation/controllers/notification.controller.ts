import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Sse,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException,
  MessageEvent,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../../shared/decorators/currentUser.decorator';
import { NotificationApplicationService } from '../../application/notification-application.service';
import {
  INotificationStream,
  NotificationSseEvent,
} from '../../application/ports/i-notification-stream.port';
import { NOTIFICATION_STREAM_TOKEN } from '../../notification.constants';
import { INotificationRepository } from '../../domain/repositories/i-notification.repository';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../notification.constants';
import { NotificationMapper } from '../../application/services/notification.mapper';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/exceptions/notification.exceptions';
import {
  GetNotificationsQueryDto,
  NotificationIdParamDto,
} from '../dto/notification-request.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly appService: NotificationApplicationService,
    @Inject(NOTIFICATION_STREAM_TOKEN)
    private readonly stream: INotificationStream,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repo: INotificationRepository,
  ) {}

  // ────────────────────────────────────────────────────────
  // SSE — single unified real-time stream
  // ────────────────────────────────────────────────────────

  /**
   * `GET /notifications/stream`
   *
   * Opens an SSE connection.  The browser reconnects automatically with
   * `Last-Event-ID` header — the server replays any missed notifications
   * from the DB that were created after that ID's timestamp.
   *
   * Multiple tabs share the same underlying RxJS Subject; the adapter
   * uses reference counting to clean up when the last tab disconnects.
   */
  @Sse('stream')
  @ApiOperation({ summary: 'Open SSE notification stream' })
  sseStream(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    this.logger.log(`SSE stream opened for user ${userId}`);

    // Replay missed notifications on reconnect
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    if (lastEventId) {
      this.replayMissed(userId, lastEventId);
    }

    return this.stream.subscribe(userId).pipe(
      map((event: NotificationSseEvent): MessageEvent => ({
        id: event.id,
        type: event.type,
        data: event.data,
      })),
    );
  }

  // ────────────────────────────────────────────────────────
  // REST endpoints
  // ────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List paginated notifications' })
  async list(
    @CurrentUser('id') userId: string,
    @Query() query: GetNotificationsQueryDto,
  ) {
    return this.appService.list({
      userId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@CurrentUser('id') userId: string) {
    return this.appService.unreadCount(userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param() params: NotificationIdParamDto,
  ) {
    try {
      await this.appService.markAsRead({
        notificationId: params.id,
        userId,
      });
    } catch (error) {
      this.mapDomainException(error);
    }
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const count = await this.appService.markAllAsRead({ userId });
    return { updated: count };
  }

  // ────────────────────────────────────────────────────────
  // Missed-notification replay (async, does not block SSE open)
  // ────────────────────────────────────────────────────────

  private async replayMissed(
    userId: string,
    lastEventId: string,
  ): Promise<void> {
    try {
      // lastEventId is the notification UUID — look up its createdAt
      const lastSeen = await this.repo.findById(lastEventId);
      if (!lastSeen) return;

      const missed = await this.repo.findAfterTimestamp(
        userId,
        lastSeen.createdAt,
      );

      for (const n of missed) {
        this.stream.push(userId, {
          id: n.id,
          type: n.type,
          data: NotificationMapper.toResponse(n),
        });
      }

      this.logger.debug(
        `Replayed ${missed.length} missed notifications for user ${userId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to replay missed notifications for user ${userId}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  // ────────────────────────────────────────────────────────
  // Domain → HTTP exception mapping
  // ────────────────────────────────────────────────────────

  private mapDomainException(error: unknown): never {
    if (error instanceof NotificationNotFoundException) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof UnauthorizedNotificationAccessException) {
      throw new ForbiddenException(error.message);
    }
    throw error;
  }
}
