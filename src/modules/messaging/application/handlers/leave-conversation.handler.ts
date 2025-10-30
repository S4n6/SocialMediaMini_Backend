import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { LeaveConversationDto } from '../dto/messaging-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.MESSAGING.LEAVE_CONVERSATION,
  priority: 1,
  middleware: ['auth'],
  description: 'Leave a conversation room',
})
@Injectable()
export class LeaveConversationHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.MESSAGING.LEAVE_CONVERSATION, 'messaging');
  }

  protected async handleEvent(
    client: Socket,
    payload: LeaveConversationDto,
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
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(
        payload.conversationId,
      );

      // Leave the conversation room
      await client.leave(conversationRoom);

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          conversationId: payload.conversationId,
          message: 'Successfully left conversation',
        },
        requestId,
      );

      // Notify other participants that user left (optional)
      await this.broadcastToRoom(
        client,
        conversationRoom,
        'conversation:user_left',
        {
          conversationId: payload.conversationId,
          userId: user.id,
          userName: user.fullName || user.username || 'Unknown User',
          timestamp: new Date().toISOString(),
        },
        true, // exclude self
      );

      this.logger.debug(
        `User ${user.id} left conversation ${payload.conversationId}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to leave conversation',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['conversationId']);
  }
}
