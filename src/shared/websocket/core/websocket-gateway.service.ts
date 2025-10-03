import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { WebSocketConnectionService } from './websocket-connection.service';
import { WebSocketEmitterService } from './websocket-emitter.service';
import { WebSocketUtilityService } from './websocket-utility.service';
import { MessagingWebSocketService } from '../services/messaging-websocket.service';
import { SocialWebSocketService } from '../services/social-websocket.service';
import { PresenceWebSocketService } from '../services/presence-websocket.service';
import {
  WebSocketEvent,
  WebSocketNamespace,
  IWebSocketGatewayService,
} from '../interfaces/websocket.interface';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
@Injectable()
export class WebSocketGatewayService
  implements IWebSocketGatewayService, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);

  constructor(
    private readonly connectionService: WebSocketConnectionService,
    private readonly emitterService: WebSocketEmitterService,
    private readonly utilityService: WebSocketUtilityService,
    private readonly messagingService: MessagingWebSocketService,
    private readonly socialService: SocialWebSocketService,
    private readonly presenceService: PresenceWebSocketService,
  ) {}

  // ============ LIFECYCLE HOOKS ============
  afterInit(server: Server) {
    this.server = server;
    this.initializeServices();
  }

  private initializeServices(): void {
    this.connectionService.setServer(this.server);
    this.emitterService.setServer(this.server);
    this.utilityService.setServer(this.server);
    this.messagingService.setServer(this.server);
    this.socialService.setServer(this.server);
    this.presenceService.setServer(this.server);
  }

  // ============ CONNECTION LIFECYCLE (DELEGATE) ============
  handleConnection(client: Socket) {
    return this.connectionService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    return this.connectionService.handleDisconnect(client);
  }

  // ============ CORE MESSAGING METHODS (DELEGATE) ============
  emitToUser(
    userId: string,
    event: WebSocketEvent,
    data: unknown,
    namespace?: WebSocketNamespace,
  ): Promise<boolean> {
    return Promise.resolve(
      this.emitterService.emitToUser(userId, event, data as any, namespace),
    );
  }

  emitToRoom(
    roomId: string,
    event: WebSocketEvent,
    data: unknown,
  ): Promise<boolean> {
    return Promise.resolve(
      this.emitterService.emitToRoom(roomId, event, data as any),
    );
  }

  broadcastToNamespace(
    namespace: WebSocketNamespace,
    event: WebSocketEvent,
    data: unknown,
  ): Promise<boolean> {
    return Promise.resolve(
      this.emitterService.broadcastToNamespace(namespace, event, data as any),
    );
  }

  // ============ CORE ROOM MANAGEMENT (DELEGATE) ============
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    return this.connectionService.handleJoinRoom(client, data);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    return this.connectionService.handleLeaveRoom(client, data);
  }

  // ============ MESSAGING FEATURE HANDLERS (DELEGATE) ============
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    return this.messagingService.handleJoinConversation(client, data);
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.messagingService.handleSendMessage(
      client,
      data as {
        conversationId: string;
        content: string;
        messageType: 'text' | 'image' | 'file';
        receiverId?: string;
      },
    );
  }

  @SubscribeMessage('typing_indicator')
  handleTypingIndicator(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.messagingService.handleTypingIndicator(
      client,
      data as { conversationId: string; isTyping: boolean },
    );
  }

  @SubscribeMessage('mark_message_read')
  handleMarkMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.messagingService.handleMarkMessageRead(
      client,
      data as { conversationId: string; messageId: string },
    );
  }

  // ============ SOCIAL FEATURE HANDLERS (DELEGATE) ============
  @SubscribeMessage('join_post')
  handleJoinPost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { postId: string },
  ) {
    return this.socialService.handleJoinPost(client, data);
  }

  @SubscribeMessage('like_post')
  handleLikePost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.socialService.handleLikePost(
      client,
      data as { postId: string; liked: boolean },
    );
  }

  @SubscribeMessage('add_comment')
  handleAddComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.socialService.handleAddComment(
      client,
      data as {
        postId: string;
        content: string;
        parentCommentId?: string;
      },
    );
  }

  @SubscribeMessage('follow_user')
  handleFollowUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.socialService.handleFollowUser(
      client,
      data as { targetUserId: string; follow: boolean },
    );
  }

  // ============ PRESENCE FEATURE HANDLERS (DELEGATE) ============
  @SubscribeMessage('update_status')
  handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.presenceService.handleUpdateStatus(
      client,
      data as { status: 'online' | 'offline' | 'away' | 'busy' },
    );
  }

  @SubscribeMessage('update_activity')
  handleUpdateActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    return this.presenceService.handleUpdateActivity(
      client,
      data as {
        activity: 'viewing_post' | 'browsing_feed' | 'in_conversation' | 'idle';
        targetId?: string;
      },
    );
  }

  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    return this.presenceService.handleGetOnlineUsers(client);
  }

  @SubscribeMessage('update_presence')
  handleUpdatePresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: string; activity?: string },
  ) {
    return this.presenceService.handleUpdateStatus(client, {
      status: data.status as 'online' | 'offline' | 'away' | 'busy',
    });
  }

  // ============ HEALTH AND MONITORING (DELEGATE) ============
  getConnectionStats(): unknown {
    return this.utilityService.getConnectionStats();
  }

  healthCheck(): { healthy: boolean; details: unknown } {
    return this.utilityService.healthCheck();
  }
}
