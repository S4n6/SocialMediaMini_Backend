import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import {
  UpdateOnlineStatusDto,
  OnlineStatusDto,
} from '../dto/messaging-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: 'user:update_online_status', // Custom event for online status
  priority: 1,
  middleware: ['auth'],
  description: 'Update user online status',
})
@Injectable()
export class UpdateOnlineStatusHandler extends BaseWebSocketHandler {
  constructor() {
    super('user:update_online_status', 'messaging');
  }

  protected async handleEvent(
    client: Socket,
    payload: UpdateOnlineStatusDto,
    requestId?: string,
  ): Promise<void> {
    const user = this.getUserFromSocket(client);
    if (!user) {
      await this.sendErrorResponse(
        client,
        'UNAUTHORIZED',
        'User not authenticated',
        requestId,
      );
      return;
    }

    try {
      // TODO: Update user online status in database
      // For now, just broadcast the status update

      const onlineStatus: OnlineStatusDto = {
        userId: user.id,
        isOnline: payload.isOnline,
        lastSeenAt: payload.lastSeenAt
          ? new Date(payload.lastSeenAt)
          : new Date(),
        timestamp: new Date(),
      };

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          status: 'updated',
          isOnline: payload.isOnline,
          lastSeenAt:
            onlineStatus.lastSeenAt?.toISOString() || new Date().toISOString(),
        },
        requestId,
      );

      // Broadcast online status to user's contacts/friends
      // TODO: Get user's contacts and broadcast to their rooms
      // For now, broadcast to online users room
      await this.broadcastToRoom(
        client,
        WEBSOCKET_ROOMS.ONLINE_USERS,
        'user:online_status_changed',
        onlineStatus,
        true, // exclude self
      );

      // If going offline, also broadcast to user's personal room
      if (!payload.isOnline) {
        const userRoom = WEBSOCKET_ROOMS.USER(user.id);
        await this.broadcastToRoom(
          client,
          userRoom,
          'user:went_offline',
          onlineStatus,
          false, // include self for offline status
        );
      }

      this.logger.debug(
        `User ${user.id} updated online status to ${payload.isOnline ? 'online' : 'offline'}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to update online status',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['isOnline']);
  }
}
