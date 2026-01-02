import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { SendMessageDto, MessageDto } from '../dto/messaging-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.MESSAGING.NEW_MESSAGE,
  priority: 1,
  middleware: ['auth'],
  description: 'Send a new message',
})
@Injectable()
export class SendMessageHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.MESSAGING.NEW_MESSAGE, 'messaging');
  }

  protected async handleEvent(
    client: Socket,
    payload: SendMessageDto,
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
      // TODO: Integrate with messaging domain service to create message
      // For now, just simulate message creation

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const message: MessageDto = {
        id: messageId,
        conversationId: payload.conversationId,
        senderId: user.id,
        content: payload.content,
        type: payload.type,
        status: 'SENT' as any,
        sentAt: now,
        senderName: user.fullName || user.username || 'Unknown User',
        senderAvatar: user.profilePicture,
        tempId: payload.tempId,
        replyToMessageId: payload.replyToMessageId,
        attachmentUrls: payload.attachmentUrls,
        location: payload.location,
        isSystemMessage: false,
      };

      // Send success response to sender
      await this.sendSuccessResponse(
        client,
        {
          message,
          tempId: payload.tempId,
          status: 'sent',
        },
        requestId,
      );

      // Broadcast message to all conversation participants
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(
        payload.conversationId,
      );
      await this.broadcastToRoom(
        client,
        conversationRoom,
        WEBSOCKET_EVENTS.MESSAGING.NEW_MESSAGE,
        message,
        true, // exclude sender
      );

      // Send delivery confirmation to sender after broadcasting
      client.emit(WEBSOCKET_EVENTS.MESSAGING.MESSAGE_DELIVERED, {
        messageId,
        conversationId: payload.conversationId,
        deliveredAt: now.toISOString(),
      });

      this.logger.debug(
        `User ${user.id} sent message to conversation ${payload.conversationId}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to send message',
        requestId,
        { error: error.message, tempId: payload.tempId },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    const hasRequired = this.validateRequiredFields(payload, [
      'conversationId',
      'content',
    ]);

    // Additional validation for content length
    if (hasRequired && payload.content) {
      const content = payload.content.trim();
      if (content.length === 0 || content.length > 4000) {
        this.logger.warn('Message content length invalid');
        return false;
      }
    }

    return hasRequired;
  }
}
