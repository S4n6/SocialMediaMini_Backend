import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import {
  StopTypingDto,
  TypingIndicatorDto,
} from '../dto/messaging-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.MESSAGING.TYPING_STOP,
  priority: 1,
  middleware: ['auth'],
  description: 'Stop typing indicator',
})
@Injectable()
export class StopTypingHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.MESSAGING.TYPING_STOP, 'messaging');
  }

  protected async handleEvent(
    client: Socket,
    payload: StopTypingDto,
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

      const typingIndicator: TypingIndicatorDto = {
        conversationId: payload.conversationId,
        userId: user.id,
        userName: user.fullName || user.username || 'Unknown User',
        isTyping: false,
        timestamp: new Date(),
      };

      // Broadcast stop typing indicator to other participants
      await this.broadcastToRoom(
        client,
        conversationRoom,
        WEBSOCKET_EVENTS.MESSAGING.TYPING_STOP,
        typingIndicator,
        true, // exclude self
      );

      // Send acknowledgment to sender
      await this.sendAcknowledgment(client, requestId);

      this.logger.debug(
        `User ${user.id} stopped typing in conversation ${payload.conversationId}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to stop typing indicator',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['conversationId']);
  }
}
