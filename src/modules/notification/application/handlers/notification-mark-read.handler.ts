import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants';
import { MarkNotificationReadDto } from '../dto/notification-websocket.dto';

@Injectable()
export class NotificationMarkReadHandler extends BaseWebSocketHandler {
  protected readonly logger = new Logger(NotificationMarkReadHandler.name);

  constructor() {
    super(WEBSOCKET_EVENTS.NOTIFICATION.MARK_READ, 'notification');
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

      // Validate payload
      if (!this.validateRequiredFields(payload, ['notificationId'])) {
        await this.sendErrorResponse(
          client,
          'INVALID_PAYLOAD',
          'notificationId is required',
          requestId,
        );
        return;
      }

      const { notificationId } = payload as MarkNotificationReadDto;

      this.logger.log(
        `Marking notification ${notificationId} as read for user ${userId}`,
      );

      // TODO: Call notification service to mark as read
      // await this.notificationService.markAsRead(userId, notificationId);

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          notificationId,
          isRead: true,
        },
        requestId,
      );

      // Broadcast to user's other connections about the read status change
      await this.broadcastToRoom(
        client,
        `user_notifications:${userId}`,
        'notification:marked_read',
        {
          notificationId,
        },
        true, // Exclude sender
      );

      this.logger.log(
        `Notification ${notificationId} marked as read for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read: ${error.message}`,
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
    return this.validateRequiredFields(payload, ['notificationId']);
  }
}
