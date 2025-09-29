import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { NotificationApplicationService } from '../../application/notification-application.service';

/**
 * Presentation layer WebSocket Gateway for real-time notifications
 * Handles WebSocket connections and real-time notification delivery
 */
@Injectable()
@WebSocketGateway({ namespace: '/notifications', cors: true })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly redisSubscriber = new Redis(process.env.REDIS_URL as string);
  private logger = new Logger('NotificationGateway');

  constructor(
    private readonly notificationApplicationService: NotificationApplicationService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.redisSubscriber.subscribe('notifications', (err) => {
      if (err) {
        this.logger.error(
          'Failed to subscribe to Redis channel: notifications',
          err,
        );
      } else {
        this.logger.log('Subscribed to Redis channel: notifications');
      }
    });

    this.redisSubscriber.on('message', (channel, message) => {
      this.logger.debug(`Received message from ${channel}: ${message}`);
      if (channel === 'notifications') {
        try {
          const { targetUserId, notification } = JSON.parse(message);

          if (!this.server) {
            this.logger.warn('Socket server not ready; skipping notify');
            return;
          }

          this.notifyUser(targetUserId, notification);
        } catch (error) {
          this.logger.error('Failed to parse notification message', error);
        }
      }
    });
  }

  handleConnection(client: Socket) {
    // Authenticate websocket handshake via token in query or headers
    const query = client.handshake.query as any;
    const token =
      query?.token || client.handshake.headers?.authorization || null;

    let userId: string | null = null;
    let email: string | null = null;

    if (token) {
      try {
        // support 'Bearer <token>' or raw token
        const raw = (token as string).startsWith('Bearer')
          ? (token as string).split(' ')[1]
          : (token as string);
        const payload = this.jwtService.verify(raw);
        // assume payload.sub contains user id
        userId = (payload as any)?.sub;
        email = (payload as any)?.email;
      } catch (err) {
        this.logger.warn(`Invalid token on websocket connect: ${client.id}`);
      }
    }

    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(
        `Client ${email} authenticated and joined room user:${userId} (socket ${client.id})`,
      );
    } else {
      this.logger.log(
        `Client connected without valid auth (socket ${client.id})`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client can acknowledge notification (mark as read)
   */
  @SubscribeMessage('ack')
  async handleAck(
    @MessageBody() data: { notificationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { notificationId, userId } = data || {};
    if (!notificationId || !userId) {
      return { success: false, error: 'Missing notificationId or userId' };
    }

    try {
      await this.notificationApplicationService.markAsRead(
        notificationId,
        userId,
      );
      return { success: true };
    } catch (err) {
      this.logger.error('Failed to ack notification', err as any);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Client requests real-time notifications
   */
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() data: { userId: string; since?: string; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, since, limit = 50 } = data || {};
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }

    try {
      const sinceDate = since
        ? new Date(since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const notifications =
        await this.notificationApplicationService.getLatestNotifications(
          userId,
          sinceDate,
          limit,
        );

      return { success: true, notifications };
    } catch (err) {
      this.logger.error('Failed to get notifications', err as any);
      return { success: false, error: 'Failed to retrieve notifications' };
    }
  }

  /**
   * Client requests unread count
   */
  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data || {};
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }

    try {
      const count =
        await this.notificationApplicationService.getUnreadCount(userId);
      return { success: true, count };
    } catch (err) {
      this.logger.error('Failed to get unread count', err as any);
      return { success: false, error: 'Failed to retrieve unread count' };
    }
  }

  /**
   * Emit notification to a specific user by userId
   */
  async notifyUser(userId: string, payload: any): Promise<void> {
    try {
      const room = `user:${userId}`;
      this.server.to(room).emit('notification', payload);
      this.logger.debug(`Notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to notify user ${userId}`, error);
    }
  }

  /**
   * Emit notification to multiple users (array of userIds)
   */
  async notifyUsers(userIds: string[], payload: any): Promise<void> {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
      // Emit to each user's room. Looping is simple and reliable.
      for (const uid of userIds) {
        const room = `user:${uid}`;
        this.server.to(room).emit('notification', payload);
      }
      this.logger.debug(`Notification sent to ${userIds.length} users`);
    } catch (error) {
      this.logger.error('Failed to notify multiple users', error);
    }
  }

  /**
   * Notify users in parallel with limited concurrency to avoid blocking
   */
  async notifyUsersParallel(
    userIds: string[],
    payload: any,
    concurrency = 20,
  ): Promise<void> {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
      const chunks: string[][] = [];
      for (let i = 0; i < userIds.length; i += concurrency) {
        chunks.push(userIds.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        // emit for this chunk in parallel
        await Promise.all(
          chunk.map((uid) =>
            this.server.to(`user:${uid}`).emit('notification', payload),
          ),
        );
        // Small pause to prevent overwhelming the system
        if (chunks.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
      this.logger.debug(
        `Notification sent to ${userIds.length} users in parallel`,
      );
    } catch (error) {
      this.logger.error('Failed to notify users in parallel', error);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  async broadcast(payload: any): Promise<void> {
    try {
      this.server.emit('notification', payload);
      this.logger.debug('Notification broadcasted to all connected clients');
    } catch (error) {
      this.logger.error('Failed to broadcast notification', error);
    }
  }

  /**
   * Send unread count update to specific user
   */
  async sendUnreadCountUpdate(userId: string, count: number): Promise<void> {
    try {
      const room = `user:${userId}`;
      this.server.to(room).emit('unreadCountUpdate', { count });
      this.logger.debug(`Unread count update sent to user ${userId}: ${count}`);
    } catch (error) {
      this.logger.error(
        `Failed to send unread count update to user ${userId}`,
        error,
      );
    }
  }

  /**
   * Send notification stats update to specific user
   */
  async sendStatsUpdate(userId: string, stats: any): Promise<void> {
    try {
      const room = `user:${userId}`;
      this.server.to(room).emit('statsUpdate', stats);
      this.logger.debug(`Stats update sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send stats update to user ${userId}`, error);
    }
  }
}
