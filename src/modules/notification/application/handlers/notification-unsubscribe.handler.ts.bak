import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants';
import { UnsubscribeNotificationDto } from '../dto/notification-websocket.dto';

@Injectable()
export class NotificationUnsubscribeHandler extends BaseWebSocketHandler {
  protected readonly logger = new Logger(NotificationUnsubscribeHandler.name);

  constructor() {
    super(WEBSOCKET_EVENTS.NOTIFICATION.UNSUBSCRIBE, 'notification');
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

      const { types } = payload as UnsubscribeNotificationDto;

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
        `User ${userId} unsubscribing from notification types: ${types.join(', ')}`,
      );

      // Leave notification type-specific rooms
      const leftRooms: string[] = [];
      for (const type of types) {
        const roomId = `notifications:${type}:${userId}`;
        await client.leave(roomId);
        leftRooms.push(roomId);
      }

      // TODO: Update subscription preferences in database/cache
      // await this.notificationService.removeSubscriptionPreferences(userId, types);

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          unsubscribedTypes: types,
          leftRooms,
        },
        requestId,
      );

      this.logger.log(
        `User ${userId} successfully unsubscribed from ${types.length} notification types`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe from notifications: ${error.message}`,
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
