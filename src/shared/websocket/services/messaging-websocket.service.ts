import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import {
  WebSocketEvent,
  WebSocketNamespace,
} from '../interfaces/websocket.interface';
import { RoomManagerService } from '../core/room-manager.service';
import { ConnectionManagerService } from '../core/connection-manager.service';

export interface MessageEventData {
  conversationId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  messageId: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'file';
}

export interface TypingEventData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageReadEventData {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

@Injectable()
export class MessagingWebSocketService {
  private readonly logger = new Logger(MessagingWebSocketService.name);
  private server: Server;

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
  ) {}

  // Set server instance from gateway
  setServer(server: Server): void {
    this.server = server;
  }

  // ============ HELPER METHODS ============

  /**
   * Emit to specific user
   */
  private emitToUser(
    userId: string,
    event: WebSocketEvent,
    data: unknown,
  ): boolean {
    try {
      const connections =
        this.connectionManager.getUserConnectionsAsync(userId);

      if (connections.length === 0) {
        this.logger.debug(`No connections found for user ${userId}`);
        return false;
      }

      let emitted = false;
      for (const connection of connections) {
        try {
          this.server.to(connection.socketId).emit(event, data as any);
          emitted = true;
        } catch (error) {
          this.logger.error(
            `Failed to emit to socket ${connection.socketId}:`,
            error,
          );
        }
      }

      return emitted;
    } catch (error) {
      this.logger.error(`Error emitting to user ${userId}:`, error);
      return false;
    }
  }

  // ============ WEBSOCKET EVENT HANDLERS ============

  /**
   * Handle join conversation event from client
   */
  handleJoinConversation(client: Socket, data: { conversationId: string }) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) {
        client.emit('error', { message: 'Connection not found' });
        return;
      }

      const conversationRoom = this.roomManager.createConversationRoom(
        data.conversationId,
        WebSocketNamespace.MESSAGING,
      );

      const joined = this.roomManager.joinRoom(
        conversationRoom.id,
        connection.userId,
        client.id,
      );

      if (joined) {
        void client.join(conversationRoom.id);
        client.emit('conversation_joined', {
          conversationId: data.conversationId,
          roomId: conversationRoom.id,
        });
      }
    } catch (error) {
      this.logger.error('Error joining conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  /**
   * Handle send message event from client
   */
  handleSendMessage(
    client: Socket,
    data: {
      conversationId: string;
      content: string;
      messageType: 'text' | 'image' | 'file';
      receiverId?: string;
    },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) {
        client.emit('error', { message: 'Connection not found' });
        return;
      }

      const messageData = {
        conversationId: data.conversationId,
        senderId: connection.userId,
        receiverId: data.receiverId,
        content: data.content,
        messageId: `msg_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        messageType: data.messageType,
      };

      // Emit to conversation room
      const conversationRoom = `conversation:${data.conversationId}`;
      this.server
        .to(conversationRoom)
        .emit(WebSocketEvent.MESSAGE_SENT, messageData);

      // If private message, also notify receiver directly
      if (data.receiverId) {
        this.emitToUser(
          data.receiverId,
          WebSocketEvent.MESSAGE_RECEIVED,
          messageData,
        );
      }

      client.emit('message_sent_ack', { messageId: messageData.messageId });
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicator event from client
   */
  handleTypingIndicator(
    client: Socket,
    data: { conversationId: string; isTyping: boolean },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      const event = data.isTyping
        ? WebSocketEvent.TYPING_START
        : WebSocketEvent.TYPING_STOP;
      const conversationRoom = `conversation:${data.conversationId}`;

      // Emit to others in the conversation (exclude sender)
      client.to(conversationRoom).emit(event, {
        conversationId: data.conversationId,
        userId: connection.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error handling typing indicator:', error);
    }
  }

  /**
   * Handle mark message as read event from client
   */
  handleMarkMessageRead(
    client: Socket,
    data: { conversationId: string; messageId: string },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      const conversationRoom = `conversation:${data.conversationId}`;
      this.server.to(conversationRoom).emit(WebSocketEvent.MESSAGE_READ, {
        conversationId: data.conversationId,
        messageId: data.messageId,
        userId: connection.userId,
        readAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
    }
  }

  // ============ BUSINESS LOGIC METHODS ============

  /**
   * Handle new message sent (called from business logic)
   */
  handleMessageSent(data: MessageEventData): void {
    try {
      const conversationRoom = this.getConversationRoomId(data.conversationId);

      // Emit to conversation room
      this.server.to(conversationRoom).emit(WebSocketEvent.MESSAGE_SENT, {
        ...data,
        namespace: WebSocketNamespace.MESSAGING,
      });

      // If it's a private conversation, also notify the receiver directly
      if (data.receiverId) {
        this.emitToUser(data.receiverId, WebSocketEvent.MESSAGE_RECEIVED, data);
      }

      this.logger.debug(`Message sent to conversation ${data.conversationId}`);
    } catch (error) {
      this.logger.error('Error handling message sent:', error);
    }
  }

  /**
   * Handle typing indicators (called from business logic)
   */
  handleTyping(data: TypingEventData): void {
    try {
      const conversationRoom = this.getConversationRoomId(data.conversationId);

      const event = data.isTyping
        ? WebSocketEvent.TYPING_START
        : WebSocketEvent.TYPING_STOP;

      this.server.to(conversationRoom).emit(event, {
        conversationId: data.conversationId,
        userId: data.userId,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Typing ${data.isTyping ? 'started' : 'stopped'} by ${data.userId} in ${data.conversationId}`,
      );
    } catch (error) {
      this.logger.error('Error handling typing:', error);
    }
  }

  /**
   * Handle message read receipts (called from business logic)
   */
  handleMessageRead(data: MessageReadEventData): void {
    try {
      const conversationRoom = this.getConversationRoomId(data.conversationId);

      this.server.to(conversationRoom).emit(WebSocketEvent.MESSAGE_READ, data);

      this.logger.debug(`Message ${data.messageId} read by ${data.userId}`);
    } catch (error) {
      this.logger.error('Error handling message read:', error);
    }
  }

  /**
   * Join user to conversation room
   */
  joinConversation(
    userId: string,
    socketId: string,
    conversationId: string,
  ): boolean {
    try {
      const room = this.roomManager.createConversationRoom(
        conversationId,
        WebSocketNamespace.MESSAGING,
      );

      return this.roomManager.joinRoom(room.id, userId, socketId);
    } catch (error) {
      this.logger.error(`Error joining conversation ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * Leave conversation room
   */
  leaveConversation(
    userId: string,
    socketId: string,
    conversationId: string,
  ): boolean {
    try {
      const roomId = this.getConversationRoomId(conversationId);
      return this.roomManager.leaveRoom(roomId, userId, socketId);
    } catch (error) {
      this.logger.error(`Error leaving conversation ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * Notify about conversation updates (metadata changes, participants added/removed)
   */
  notifyConversationUpdate(
    conversationId: string,
    updateData: Record<string, unknown>,
  ): void {
    try {
      const conversationRoom = this.getConversationRoomId(conversationId);

      this.server
        .to(conversationRoom)
        .emit(WebSocketEvent.CONVERSATION_UPDATED, {
          conversationId,
          ...updateData,
          timestamp: new Date(),
        });

      this.logger.debug(`Conversation ${conversationId} updated`);
    } catch (error) {
      this.logger.error('Error notifying conversation update:', error);
    }
  }

  /**
   * Notify about new conversation creation
   */
  notifyConversationCreated(
    participants: string[],
    conversationData: Record<string, unknown>,
  ): void {
    try {
      // Notify all participants
      for (const userId of participants) {
        this.emitToUser(
          userId,
          WebSocketEvent.CONVERSATION_CREATED,
          conversationData,
        );
      }

      this.logger.debug(
        `New conversation created with ${participants.length} participants`,
      );
    } catch (error) {
      this.logger.error('Error notifying conversation creation:', error);
    }
  }

  /**
   * Get conversation room ID
   */
  private getConversationRoomId(conversationId: string): string {
    return `conversation:${conversationId}`;
  }
}
