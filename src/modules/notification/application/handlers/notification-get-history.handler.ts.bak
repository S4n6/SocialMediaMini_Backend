import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers';
import {
  GetNotificationHistoryDto,
  NotificationDto,
} from '../dto/notification-websocket.dto';

@Injectable()
export class NotificationGetHistoryHandler extends BaseWebSocketHandler {
  protected readonly logger = new Logger(NotificationGetHistoryHandler.name);

  constructor() {
    super('notification:get_history', 'notification');
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

      const {
        cursor,
        limit = '20',
        type,
        unreadOnly,
      } = payload as GetNotificationHistoryDto;

      this.logger.log(`Getting notification history for user ${userId}`);

      // TODO: Call notification service to get history
      // const result = await this.notificationService.getHistory(userId, {
      //   cursor,
      //   limit: parseInt(limit),
      //   type,
      //   unreadOnly
      // });

      // Placeholder data
      const notifications: NotificationDto[] = [];
      const hasMore = false;
      const nextCursor = null;
      const total = 0;

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          notifications,
          pagination: {
            hasMore,
            nextCursor,
            total,
          },
          filters: {
            type: type || 'all',
            unreadOnly: unreadOnly || false,
          },
        },
        requestId,
      );

      this.logger.log(
        `Retrieved ${notifications.length} notifications for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get notification history: ${error.message}`,
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
    // All fields are optional for this handler
    return true;
  }
}
