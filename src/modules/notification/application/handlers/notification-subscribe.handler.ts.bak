import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants';
import { SubscribeNotificationDto } from '../dto/notification-websocket.dto';

@Injectable()
export class NotificationSubscribeHandler extends BaseWebSocketHandler {
  protected readonly logger = new Logger(NotificationSubscribeHandler.name);

  constructor() {
    super(WEBSOCKET_EVENTS.NOTIFICATION.SUBSCRIBE, 'notification');
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
      if (!this.validateRequiredFields(payload, ['types'])) {
        await this.sendErrorResponse(
          client,
          'INVALID_PAYLOAD',
          'types array is required',
          requestId,
        );
        return;
      }

      const { types, filters } = payload as SubscribeNotificationDto;

      if (!Array.isArray(types) || types.length === 0) {
        await this.sendErrorResponse(
          client,
          'INVALID_PAYLOAD',
          'types must be a non-empty array',
          requestId,
        );
        return;
      }

      this.logger.log(
        `User ${userId} subscribing to notification types: ${types.join(', ')}`,
      );

      // Join notification type-specific rooms
      for (const type of types) {
        const roomId = `notifications:${type}:${userId}`;
        await client.join(roomId);
      }

      // Join general user notification room if not already joined
      const userNotificationRoom = `user_notifications:${userId}`;
      await client.join(userNotificationRoom);

      // TODO: Store subscription preferences in database/cache
      // await this.notificationService.updateSubscriptionPreferences(userId, types, filters);

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          subscribedTypes: types,
          filters: filters || {},
          rooms: [
            userNotificationRoom,
            ...types.map((type) => `notifications:${type}:${userId}`),
          ],
        },
        requestId,
      );

      this.logger.log(
        `User ${userId} successfully subscribed to ${types.length} notification types`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to notifications: ${error.message}`,
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
    return (
      this.validateRequiredFields(payload, ['types']) &&
      Array.isArray(payload.types) &&
      payload.types.length > 0
    );
  }
}
