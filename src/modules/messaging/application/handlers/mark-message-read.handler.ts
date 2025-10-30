import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { MarkMessageReadDto } from '../dto/messaging-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.MESSAGING.MESSAGE_READ,
  priority: 1,
  middleware: ['auth'],
  description: 'Mark message as read',
})
@Injectable()
export class MarkMessageReadHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.MESSAGING.MESSAGE_READ, 'messaging');
  }

  protected async handleEvent(
    client: Socket,
    payload: MarkMessageReadDto,
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
      // TODO: Integrate with messaging domain service to mark message as read
      // For now, just simulate success

      const readAt = payload.readAt || new Date();

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          messageId: payload.messageId,
          readAt: readAt.toISOString(),
          readBy: user.id,
        },
        requestId,
      );

      // TODO: Get conversation ID from message
      // For now, assuming we have it somehow
      const conversationId = 'temp-conversation-id'; // This should come from message lookup
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);

      // Broadcast read receipt to conversation participants
      await this.broadcastToRoom(
        client,
        conversationRoom,
        WEBSOCKET_EVENTS.MESSAGING.MESSAGE_READ,
        {
          messageId: payload.messageId,
          readAt: readAt.toISOString(),
          readBy: user.id,
          readerName: user.fullName || user.username || 'Unknown User',
        },
        true, // exclude self
      );

      this.logger.debug(
        `User ${user.id} marked message ${payload.messageId} as read`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to mark message as read',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['messageId']);
  }
}
