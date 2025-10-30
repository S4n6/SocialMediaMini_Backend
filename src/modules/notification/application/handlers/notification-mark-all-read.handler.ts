import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants';
import { MarkAllNotificationsReadDto } from '../dto/notification-websocket.dto';

@Injectable()
export class NotificationMarkAllReadHandler extends BaseWebSocketHandler {
  protected readonly logger = new Logger(NotificationMarkAllReadHandler.name);

  constructor() {
    super(WEBSOCKET_EVENTS.NOTIFICATION.MARK_ALL_READ, 'notification');
  }

  protected async handleEvent(
    client: Socket,
    payload: any,
    requestId?: string,
  ): Promise<void> {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        await this.sendErrorResponse(
          client,
          'UNAUTHORIZED',
          'User not authenticated',
          requestId,
        );
        return;
      }

      const { type } = payload as MarkAllNotificationsReadDto;

      this.logger.log(
        `Marking all notifications as read for user ${userId}${type ? ` of type ${type}` : ''}`,
      );

      // TODO: Call notification service to mark all as read
      // const markedCount = await this.notificationService.markAllAsRead(userId, type);

      const markedCount = 0; // Placeholder

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          markedCount,
          type: type || 'all',
        },
        requestId,
      );

      // Broadcast to user's other connections
      await this.broadcastToRoom(
        client,
        `user_notifications:${userId}`,
        'notification:all_marked_read',
        {
          markedCount,
          type: type || 'all',
        },
        true, // Exclude sender
      );

      this.logger.log(
        `Marked ${markedCount} notifications as read for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read: ${error.message}`,
        error.stack,
      );
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        error.message,
        requestId,
      );
    }
  }

  validatePayload(payload: any): boolean {
    // Payload is optional for this handler
    return true;
  }
}
