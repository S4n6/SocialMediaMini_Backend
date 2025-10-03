import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageUseCases } from '../../application/use-cases/message.use-cases';
import { ConversationUseCases } from '../../application/use-cases/conversation.use-cases';
import {
  SendMessageDto,
  MarkMessageAsReadDto,
  TypingIndicatorDto,
} from '../dto';
import { MessageType } from '../../domain/enums';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err as unknown);
  } catch {
    return String(err);
  }
}

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    @Inject('MESSAGE_USE_CASES')
    private readonly messageUseCases: MessageUseCases,
    @Inject('CONVERSATION_USE_CASES')
    private readonly conversationUseCases: ConversationUseCases,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const userId = client.userId;
      if (!userId) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(userId, client.id);

      // Join user to their conversation rooms
      const conversations =
        await this.conversationUseCases.getUserConversations({
          userId,
        });

      conversations.forEach((conversation) => {
        client.join(`conversation:${conversation.id.value}`);
      });

      // Set user as online
      client.broadcast.emit('user:online', { userId });

      this.logger.log(`User ${userId} connected to messaging`);
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Connection error: ${_err}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    try {
      const userId = client.userId;
      if (userId) {
        this.connectedUsers.delete(userId);

        // Set user as offline
        client.broadcast.emit('user:offline', { userId });

        this.logger.log(`User ${userId} disconnected from messaging`);
      }
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Disconnect error: ${_err}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const userId = client.userId;
      if (!userId) return;

      let messageId: string;

      if (data.type === MessageType.TEXT || !data.type) {
        messageId = await this.messageUseCases.sendTextMessage({
          senderId: userId,
          conversationId: data.conversationId,
          content: data.content,
        });
      } else {
        messageId = await this.messageUseCases.sendMediaMessage({
          senderId: userId,
          conversationId: data.conversationId,
          type: data.type,
          attachmentUrl: data.attachments?.[0] || '',
          content: data.content,
        });
      }

      // Emit to all participants in the conversation
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:received', {
          messageId,
          conversationId: data.conversationId,
        });

      return { success: true, messageId };
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Send message error: ${_err}`);
      // safe emit — log if emit fails
      try {
        client.emit('error', { message: _err });
      } catch (emitErr) {
        this.logger.error(
          'Failed to emit error to client',
          getErrorMessage(emitErr),
        );
      }
      return { success: false, error: _err };
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkMessageAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: MarkMessageAsReadDto,
  ) {
    try {
      const userId = client.userId;
      if (!userId) return;

      await this.messageUseCases.markMessageAsRead({
        messageId: data.messageId,
        userId,
      });

      // Notify other participants that message was read
      client.to(`conversation:${data.conversationId}`).emit('message:read', {
        messageId: data.messageId,
        userId,
        readAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Mark message as read error: ${_err}`);
      return { success: false, error: _err };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    try {
      const userId = client.userId;
      if (!userId) return;

      client.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Typing start error: ${_err}`);
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    try {
      const userId = client.userId;
      if (!userId) return;

      client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Typing stop error: ${_err}`);
    }
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const userId = client.userId;
      if (!userId) return;

      // Verify user is participant in the conversation
      const conversation = await this.conversationUseCases.getConversationById(
        data.conversationId,
        userId,
      );

      if (conversation) {
        client.join(`conversation:${data.conversationId}`);
        return { success: true };
      }

      return { success: false, error: 'Access denied' };
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Join conversation error: ${_err}`);
      return { success: false, error: _err };
    }
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      client.leave(`conversation:${data.conversationId}`);
      return { success: true };
    } catch (error) {
      const _err = getErrorMessage(error);
      this.logger.error(`Leave conversation error: ${_err}`);
      return { success: false, error: _err };
    }
  }

  // Method to emit message to specific user
  emitToUser(userId: string, event: string, data: unknown) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      try {
        this.server.to(socketId).emit(event, data);
      } catch (err) {
        this.logger.error('Failed to emit to user', getErrorMessage(err));
      }
    }
  }

  // Method to emit to conversation participants
  emitToConversation(conversationId: string, event: string, data: unknown) {
    try {
      this.server.to(`conversation:${conversationId}`).emit(event, data);
    } catch (err) {
      this.logger.error('Failed to emit to conversation', getErrorMessage(err));
    }
  }
}
