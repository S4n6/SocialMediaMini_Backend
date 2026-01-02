import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { JoinConversationDto } from '../dto/messaging-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.MESSAGING.JOIN_CONVERSATION,
  priority: 1,
  middleware: ['auth'],
  description: 'Join a conversation room',
})
@Injectable()
export class JoinConversationHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.MESSAGING.JOIN_CONVERSATION, 'messaging');
  }

  protected async handleEvent(
    client: Socket,
    payload: JoinConversationDto,
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
      // TODO: Check if user has permission to join this conversation
      // For now, just allow joining any conversation

      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(
        payload.conversationId,
      );

      // Join the conversation room
      await client.join(conversationRoom);

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          conversationId: payload.conversationId,
          room: conversationRoom,
          message: 'Successfully joined conversation',
        },
        requestId,
      );

      // Notify other participants that user joined (optional)
      await this.broadcastToRoom(
        client,
        conversationRoom,
        'conversation:user_joined',
        {
          conversationId: payload.conversationId,
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown User',
          timestamp: new Date().toISOString(),
        },
        true, // exclude self
      );

      this.logger.debug(
        `User ${user.id} joined conversation ${payload.conversationId}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to join conversation',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['conversationId']);
  }
}
