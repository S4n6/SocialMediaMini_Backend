import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { MainWebSocketGateway } from '../../../../shared/websocket/websocket.gateway';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';
import {
  MessageDto,
  ConversationDto,
  TypingIndicatorDto,
  OnlineStatusDto,
  ConversationUpdateDto,
} from '../dto/messaging-websocket.dto';

@Injectable()
export class MessagingWebSocketService {
  private readonly logger = new Logger(MessagingWebSocketService.name);

  constructor(
    @Inject(forwardRef(() => MainWebSocketGateway))
    private readonly gateway: MainWebSocketGateway,
  ) {}

  /**
   * Broadcast new message to conversation participants
   */
  async broadcastNewMessage(message: MessageDto): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(
        message.conversationId,
      );

      this.gateway.server
        .to(conversationRoom)
        .emit(WEBSOCKET_EVENTS.MESSAGING.NEW_MESSAGE, message);

      this.logger.debug(
        `Broadcasted new message ${message.id} to conversation ${message.conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast new message: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast message delivery confirmation
   */
  async broadcastMessageDelivered(
    messageId: string,
    conversationId: string,
    deliveredToUserId: string,
  ): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);

      const deliveryData = {
        messageId,
        conversationId,
        deliveredToUserId,
        deliveredAt: new Date().toISOString(),
      };

      this.gateway.server
        .to(conversationRoom)
        .emit(WEBSOCKET_EVENTS.MESSAGING.MESSAGE_DELIVERED, deliveryData);

      this.logger.debug(`Broadcasted message delivery for ${messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast message delivery: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast message read receipt
   */
  async broadcastMessageRead(
    messageId: string,
    conversationId: string,
    readByUserId: string,
    readerName: string,
  ): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);

      const readData = {
        messageId,
        conversationId,
        readByUserId,
        readerName,
        readAt: new Date().toISOString(),
      };

      this.gateway.server
        .to(conversationRoom)
        .emit(WEBSOCKET_EVENTS.MESSAGING.MESSAGE_READ, readData);

      this.logger.debug(`Broadcasted message read receipt for ${messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast message read receipt: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast typing indicator
   */
  async broadcastTypingIndicator(
    typingIndicator: TypingIndicatorDto,
  ): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(
        typingIndicator.conversationId,
      );

      const eventName = typingIndicator.isTyping
        ? WEBSOCKET_EVENTS.MESSAGING.TYPING_START
        : WEBSOCKET_EVENTS.MESSAGING.TYPING_STOP;

      this.gateway.server.to(conversationRoom).emit(eventName, typingIndicator);

      this.logger.debug(
        `Broadcasted typing indicator (${typingIndicator.isTyping ? 'start' : 'stop'}) for user ${typingIndicator.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast typing indicator: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast online status update
   */
  async broadcastOnlineStatus(
    onlineStatus: OnlineStatusDto,
    userContacts?: string[],
  ): Promise<void> {
    try {
      // Broadcast to online users room
      this.gateway.server
        .to(WEBSOCKET_ROOMS.ONLINE_USERS)
        .emit('user:online_status_changed', onlineStatus);

      // Broadcast to specific user contacts if provided
      if (userContacts && userContacts.length > 0) {
        for (const contactId of userContacts) {
          const contactRoom = WEBSOCKET_ROOMS.USER(contactId);
          this.gateway.server
            .to(contactRoom)
            .emit('user:online_status_changed', onlineStatus);
        }
      }

      this.logger.debug(
        `Broadcasted online status for user ${onlineStatus.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast online status: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast conversation update
   */
  async broadcastConversationUpdate(
    conversationUpdate: ConversationUpdateDto,
  ): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(
        conversationUpdate.conversationId,
      );

      this.gateway.server
        .to(conversationRoom)
        .emit(
          WEBSOCKET_EVENTS.MESSAGING.CONVERSATION_UPDATED,
          conversationUpdate,
        );

      this.logger.debug(
        `Broadcasted conversation update for ${conversationUpdate.conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast conversation update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Notify user of new conversation
   */
  async notifyNewConversation(
    userId: string,
    conversation: ConversationDto,
  ): Promise<void> {
    try {
      const userRoom = WEBSOCKET_ROOMS.USER(userId);

      this.gateway.server.to(userRoom).emit('conversation:new', conversation);

      this.logger.debug(
        `Notified user ${userId} of new conversation ${conversation.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify new conversation: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send direct message to specific user
   */
  async sendDirectMessage(
    userId: string,
    event: string,
    data: any,
  ): Promise<void> {
    try {
      const userRoom = WEBSOCKET_ROOMS.USER(userId);
      this.gateway.server.to(userRoom).emit(event, data);

      this.logger.debug(`Sent direct message ${event} to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send direct message: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Emit event to conversation room
   */
  async emitToConversation(
    conversationId: string,
    event: string,
    data: any,
    excludeUserId?: string,
  ): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);

      if (excludeUserId) {
        // Get all sockets in the room and exclude specific user
        const roomSockets = await this.gateway.server
          .in(conversationRoom)
          .fetchSockets();
        const filteredSockets = roomSockets.filter((socket) => {
          const user = (socket as any).user;
          return user && user.id !== excludeUserId;
        });

        for (const socket of filteredSockets) {
          socket.emit(event, data);
        }
      } else {
        this.gateway.server.to(conversationRoom).emit(event, data);
      }

      this.logger.debug(`Emitted ${event} to conversation ${conversationId}`);
    } catch (error) {
      this.logger.error(
        `Failed to emit to conversation: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get conversation participants count
   */
  async getConversationParticipantsCount(
    conversationId: string,
  ): Promise<number> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      const roomSockets = await this.gateway.server
        .in(conversationRoom)
        .fetchSockets();
      return roomSockets.length;
    } catch (error) {
      this.logger.error(
        `Failed to get conversation participants count: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Get online users in conversation
   */
  async getOnlineParticipants(conversationId: string): Promise<string[]> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      const roomSockets = await this.gateway.server
        .in(conversationRoom)
        .fetchSockets();

      const onlineUserIds = roomSockets
        .map((socket) => {
          const user = (socket as any).user;
          return user?.id;
        })
        .filter(Boolean);

      return onlineUserIds;
    } catch (error) {
      this.logger.error(
        `Failed to get online participants: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Check if user is online in conversation
   */
  async isUserOnlineInConversation(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const onlineParticipants =
        await this.getOnlineParticipants(conversationId);
      return onlineParticipants.includes(userId);
    } catch (error) {
      this.logger.error(
        `Failed to check user online status: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Force disconnect user from conversation (admin action)
   */
  async disconnectUserFromConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    try {
      const conversationRoom = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      const roomSockets = await this.gateway.server
        .in(conversationRoom)
        .fetchSockets();

      const userSocket = roomSockets.find((socket) => {
        const user = (socket as any).user;
        return user?.id === userId;
      });

      if (userSocket) {
        await userSocket.leave(conversationRoom);
        userSocket.emit('conversation:force_disconnect', {
          conversationId,
          reason: 'Removed from conversation',
        });

        this.logger.debug(
          `Force disconnected user ${userId} from conversation ${conversationId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to force disconnect user: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast system message to conversation
   */
  async broadcastSystemMessage(
    conversationId: string,
    message: string,
    data?: any,
  ): Promise<void> {
    try {
      const systemMessage: Partial<MessageDto> = {
        id: `system_${Date.now()}`,
        conversationId,
        senderId: undefined,
        content: message,
        type: 'SYSTEM' as any,
        status: 'SENT' as any,
        sentAt: new Date(),
        isSystemMessage: true,
        ...data,
      };

      await this.broadcastNewMessage(systemMessage as MessageDto);

      this.logger.debug(
        `Broadcasted system message to conversation ${conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast system message: ${error.message}`,
        error.stack,
      );
    }
  }
}
