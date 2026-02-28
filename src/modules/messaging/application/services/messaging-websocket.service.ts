import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  WebSocketEventEmitter,
  ConnectionManagerService,
  PresenceService,
  WEBSOCKET_EVENTS,
  WEBSOCKET_ROOMS,
} from '../../../../infrastructure/websocket';
import {
  IWebSocketEvent,
  WebSocketEventType,
} from '../../../../infrastructure/websocket/events';

/**
 * Messaging WebSocket Service
 *
 * Bridges between domain use cases and Socket.IO event emission.
 * This service knows HOW to push data to connected clients but contains
 * zero business logic.
 *
 * Replaces the old messaging-websocket.service.ts.bak which had:
 * - Circular forwardRef dependency on MainWebSocketGateway
 * - Wrong import paths
 * - Direct server access instead of using the EventEmitter abstraction
 */
@Injectable()
export class MessagingWebSocketService {
  private readonly logger = new Logger(MessagingWebSocketService.name);

  constructor(
    private readonly eventEmitter: WebSocketEventEmitter,
    private readonly connectionManager: ConnectionManagerService,
    private readonly presenceService: PresenceService,
  ) {}

  // ─── Message Broadcasting ───────────────────────────────────────────

  /**
   * Broadcast a new message to all participants in a conversation room.
   * @param excludeSocketId - Socket ID to exclude (the sender's current socket)
   */
  async broadcastNewMessage(
    conversationId: string,
    messageData: Record<string, any>,
    excludeSocketId?: string,
  ): Promise<void> {
    try {
      const room = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      const event: IWebSocketEvent = {
        type: WebSocketEventType.MESSAGE_SENT,
        payload: messageData,
        timestamp: new Date(),
      };

      // Use emitToRoom which broadcasts to all sockets in the room
      // The excludeSocketId handling is done at the gateway level via client.to(room)
      await this.eventEmitter.emitToRoom(room, event);

      this.logger.debug(
        `Broadcasted message ${messageData.messageId} to conversation ${conversationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast message: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast message delivery confirmation to conversation participants.
   */
  async broadcastMessageDelivered(
    conversationId: string,
    messageId: string,
    deliveredToUserId: string,
  ): Promise<void> {
    try {
      const room = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      await this.eventEmitter.emitToRoom(room, {
        type: WebSocketEventType.MESSAGE_DELIVERED,
        payload: {
          messageId,
          conversationId,
          deliveredToUserId,
          deliveredAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to broadcast delivery: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast read receipt to conversation participants.
   */
  async broadcastReadReceipt(
    conversationId: string,
    readByUserId: string,
    messageId?: string,
  ): Promise<void> {
    try {
      const room = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      await this.eventEmitter.emitToRoom(room, {
        type: WebSocketEventType.MESSAGE_READ,
        payload: {
          conversationId,
          readByUserId,
          messageId,
          readAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to broadcast read receipt: ${error.message}`,
        error.stack,
      );
    }
  }

  // ─── Conversation Lifecycle ─────────────────────────────────────────

  /**
   * Notify a specific user about a new conversation they were added to.
   */
  async notifyNewConversation(
    userId: string,
    conversationData: Record<string, any>,
  ): Promise<void> {
    try {
      const event: IWebSocketEvent = {
        type: WebSocketEventType.CONVERSATION_UPDATED,
        payload: {
          action: 'created',
          ...conversationData,
        },
        timestamp: new Date(),
      };
      await this.eventEmitter.emitToUser(userId, event);
    } catch (error) {
      this.logger.error(
        `Failed to notify new conversation: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast a conversation update (title change, settings, etc.) to all participants.
   */
  async broadcastConversationUpdate(
    conversationId: string,
    updateData: Record<string, any>,
  ): Promise<void> {
    try {
      const room = WEBSOCKET_ROOMS.CONVERSATION(conversationId);
      await this.eventEmitter.emitToRoom(room, {
        type: WebSocketEventType.CONVERSATION_UPDATED,
        payload: {
          conversationId,
          ...updateData,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to broadcast conversation update: ${error.message}`,
        error.stack,
      );
    }
  }

  // ─── Online Presence ────────────────────────────────────────────────

  /**
   * Broadcast a user's online status change to their conversation partners.
   */
  async broadcastOnlineStatusToContacts(
    userId: string,
    isOnline: boolean,
    contactUserIds: string[],
  ): Promise<void> {
    try {
      const payload = {
        userId,
        isOnline,
        lastSeen: new Date().toISOString(),
      };

      // Notify each contact individually (through their personal room)
      const notifications = contactUserIds.map((contactId) =>
        this.eventEmitter.emitToUser(contactId, {
          type: 'user:online_status_changed' as any,
          payload,
          timestamp: new Date(),
        }),
      );

      await Promise.all(notifications);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast online status: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get online conversation participants for a given conversation.
   */
  async getOnlineParticipants(
    participantUserIds: string[],
  ): Promise<Map<string, boolean>> {
    return this.presenceService.getOnlineStatusBatch(participantUserIds);
  }
}
