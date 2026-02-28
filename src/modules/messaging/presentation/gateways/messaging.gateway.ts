import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseGuards, Inject } from '@nestjs/common';
import {
  AuthenticatedSocket,
  WsAuthGuard,
  WEBSOCKET_EVENTS,
  WEBSOCKET_ROOMS,
  RoomManagerService,
  WebSocketAuthService,
} from '../../../../infrastructure/websocket';
import { MESSAGING_TOKENS } from '../../constants';
import { SendTextMessageUseCase } from '../../application/use-cases';
import { MarkAsReadUseCase } from '../../application/use-cases';
import { IConversationRepository } from '../../domain';
import { ConversationId, UserId } from '../../domain';
import { MessagingWebSocketService } from '../../application/services/messaging-websocket.service';

// ─── Payload interfaces (lightweight; class-validator DTOs are for REST) ────

interface JoinConversationPayload {
  conversationId: string;
}

interface LeaveConversationPayload {
  conversationId: string;
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
  tempId?: string; // Client-side optimistic ID for ack
  replyToMessageId?: string;
}

interface TypingPayload {
  conversationId: string;
}

interface MarkReadPayload {
  conversationId: string;
  messageId?: string; // If absent, mark all as read
}

/**
 * Messaging WebSocket Gateway
 *
 * Handles all real-time messaging events from clients.
 * Shares the same Socket.IO server as MainGateway (default namespace '/').
 *
 * Authentication: MainGateway.handleConnection() validates JWT during the
 * handshake and attaches `userId`/`user` to the socket. The WsAuthGuard
 * on each handler simply asserts that property exists.
 *
 * Flow:
 *   Client emits 'messaging:send_message' → this handler →
 *     1. Validate participation
 *     2. Execute use case (persist)
 *     3. Broadcast to conversation room via MessagingWebSocketService
 *     4. Ack sender with messageId
 */
@WebSocketGateway()
@UseGuards(WsAuthGuard)
export class MessagingGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly roomManager: RoomManagerService,
    private readonly authService: WebSocketAuthService,
    private readonly wsService: MessagingWebSocketService,
    private readonly sendTextMessageUseCase: SendTextMessageUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepo: IConversationRepository,
  ) {}

  // ─── Room Management ────────────────────────────────────────────────

  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGING.JOIN_CONVERSATION)
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const userId = client.userId;

    if (!payload?.conversationId) {
      return {
        event: 'error',
        data: { message: 'conversationId is required' },
      };
    }

    // Verify user is a participant in this conversation
    const conversationId = ConversationId.fromString(payload.conversationId);
    const conversation = await this.conversationRepo.findById(conversationId);

    if (!conversation) {
      return { event: 'error', data: { message: 'Conversation not found' } };
    }

    if (!conversation.isParticipant(UserId.fromString(userId))) {
      return { event: 'error', data: { message: 'Access denied' } };
    }

    const room = WEBSOCKET_ROOMS.CONVERSATION(payload.conversationId);
    await client.join(room);
    await this.roomManager.joinRoom(room, client.id, userId);

    // Notify other participants
    client.to(room).emit('conversation:user_joined', {
      userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(
      `User ${userId} joined conversation room ${payload.conversationId}`,
    );

    return {
      event: WEBSOCKET_EVENTS.MESSAGING.JOIN_CONVERSATION,
      data: {
        success: true,
        conversationId: payload.conversationId,
      },
    };
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGING.LEAVE_CONVERSATION)
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveConversationPayload,
  ) {
    const userId = client.userId;

    if (!payload?.conversationId) {
      return {
        event: 'error',
        data: { message: 'conversationId is required' },
      };
    }

    const room = WEBSOCKET_ROOMS.CONVERSATION(payload.conversationId);
    await client.leave(room);
    await this.roomManager.leaveRoom(room, client.id, userId);

    // Notify other participants
    client.to(room).emit('conversation:user_left', {
      userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(
      `User ${userId} left conversation room ${payload.conversationId}`,
    );

    return {
      event: WEBSOCKET_EVENTS.MESSAGING.LEAVE_CONVERSATION,
      data: {
        success: true,
        conversationId: payload.conversationId,
      },
    };
  }

  // ─── Messaging ──────────────────────────────────────────────────────

  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGING.NEW_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const userId = client.userId;

    if (!payload?.conversationId || !payload?.content?.trim()) {
      return {
        event: 'error',
        data: {
          message: 'conversationId and content are required',
          tempId: payload?.tempId,
        },
      };
    }

    if (payload.content.length > 4000) {
      return {
        event: 'error',
        data: {
          message: 'Message content exceeds 4000 characters',
          tempId: payload.tempId,
        },
      };
    }

    try {
      // 1. Execute domain use case (validates, persists, updates conversation)
      const result = await this.sendTextMessageUseCase.execute({
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content.trim(),
      });

      const messageData = {
        messageId: result.messageId,
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content.trim(),
        sentAt: new Date().toISOString(),
        replyToMessageId: payload.replyToMessageId,
      };

      // 2. Broadcast to all conversation participants (including sender on other tabs)
      await this.wsService.broadcastNewMessage(
        payload.conversationId,
        messageData,
        client.id, // Exclude this socket to avoid double delivery
      );

      // 3. Ack the sender
      return {
        event: 'message:sent',
        data: {
          messageId: result.messageId,
          tempId: payload.tempId,
          conversationId: payload.conversationId,
          sentAt: messageData.sentAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to send message for user ${userId}: ${error.message}`,
      );
      return {
        event: 'error',
        data: {
          message: error.message || 'Failed to send message',
          tempId: payload.tempId,
        },
      };
    }
  }

  // ─── Typing Indicators ─────────────────────────────────────────────

  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGING.TYPING_START)
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    if (!payload?.conversationId) return;

    const room = WEBSOCKET_ROOMS.CONVERSATION(payload.conversationId);

    // Fire-and-forget: typing is ephemeral, no persistence needed
    client.to(room).emit(WEBSOCKET_EVENTS.MESSAGING.TYPING_START, {
      userId: client.userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGING.TYPING_STOP)
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ) {
    if (!payload?.conversationId) return;

    const room = WEBSOCKET_ROOMS.CONVERSATION(payload.conversationId);

    client.to(room).emit(WEBSOCKET_EVENTS.MESSAGING.TYPING_STOP, {
      userId: client.userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Read Receipts ─────────────────────────────────────────────────

  @SubscribeMessage(WEBSOCKET_EVENTS.MESSAGING.MESSAGE_READ)
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: MarkReadPayload,
  ) {
    const userId = client.userId;

    if (!payload?.conversationId) {
      return {
        event: 'error',
        data: { message: 'conversationId is required' },
      };
    }

    try {
      await this.markAsReadUseCase.markConversationAsRead({
        conversationId: payload.conversationId,
        userId,
      });

      // Broadcast read receipt to conversation room
      await this.wsService.broadcastReadReceipt(
        payload.conversationId,
        userId,
        payload.messageId,
      );

      return {
        event: WEBSOCKET_EVENTS.MESSAGING.MESSAGE_READ,
        data: {
          success: true,
          conversationId: payload.conversationId,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to mark messages read for user ${userId}: ${error.message}`,
      );
      return {
        event: 'error',
        data: { message: 'Failed to mark as read' },
      };
    }
  }
}
