import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
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

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    try {
      return JSON.stringify(err ?? {});
    } catch {
      return String(err);
    }
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};
  }

  afterInit(server: Server) {
    this.server = server;
    // subscribe may return a promise in some ioredis versions; intentionally not awaiting
    void this.redisSubscriber.subscribe('notifications', (err) => {
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
      this.logger.debug(`Received message on channel ${channel}`);
      if (channel !== 'notifications') return;

      try {
        let parsedRaw: unknown;
        try {
          parsedRaw = JSON.parse(message);
        } catch (error) {
          this.logger.error(
            'Failed to parse notification message: ' +
              this.getErrorMessage(error),
          );
          return;
        }

        const parsed = this.asRecord(parsedRaw);
        const targetUserId =
          typeof parsed.targetUserId === 'string' ? parsed.targetUserId : '';
        const notification = parsed.notification;

        if (!this.server) {
          this.logger.warn('Socket server not ready; skipping notify');
          return;
        }

        // notifyUser is async; intentionally do not await here
        void this.notifyUser(targetUserId, notification);
      } catch (error) {
        this.logger.error(
          'Failed handling notification message: ' +
            this.getErrorMessage(error),
        );
      }
    });
  }

  handleConnection(client: Socket) {
    // Authenticate websocket handshake via token in query or headers
    const query = client.handshake.query as unknown as
      | Record<string, unknown>
      | undefined;
    const headerAuth = client.handshake.headers?.authorization;
    const tokenVal =
      (query && typeof query.token === 'string' && query.token) ||
      (typeof headerAuth === 'string' && headerAuth) ||
      null;

    let userId: string | null = null;
    let email: string | null = null;

    if (typeof tokenVal === 'string' && tokenVal.length > 0) {
      try {
        // support 'Bearer <token>' or raw token
        const raw = tokenVal.startsWith('Bearer')
          ? tokenVal.split(' ')[1]
          : tokenVal;
        const payload = this.jwtService.verify(raw) as unknown;
        if (payload && typeof payload === 'object') {
          const p = payload as Record<string, unknown>;
          userId = typeof p.sub === 'string' ? p.sub : null;
          email = typeof p.email === 'string' ? p.email : null;
        }
      } catch (err) {
        this.logger.warn(
          `Invalid token on websocket connect: ${client.id}`,
          err as Error,
        );
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
      this.logger.error('Failed to ack notification', err);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Client requests real-time notifications
   */
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() data: { userId: string; since?: string; limit?: number },
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
      this.logger.error('Failed to get notifications', err);
      return { success: false, error: 'Failed to retrieve notifications' };
    }
  }

  /**
   * Client requests unread count
   */
  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(@MessageBody() data: { userId: string }) {
    const { userId } = data || {};
    if (!userId) {
      return { success: false, error: 'Missing userId' };
    }

    try {
      const count =
        await this.notificationApplicationService.getUnreadCount(userId);
      return { success: true, count };
    } catch (err) {
      this.logger.error('Failed to get unread count', err);
      return { success: false, error: 'Failed to retrieve unread count' };
    }
  }

  /**
   * Emit notification to a specific user by userId
   */
  notifyUser(userId: string, payload: unknown): Promise<void> {
    try {
      const room = `user:${userId}`;
      this.server.to(room).emit('notification', payload);
      this.logger.debug(`Notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to notify user ${userId}: ${String(error)}`);
    }

    return Promise.resolve();
  }

  /**
   * Emit notification to multiple users (array of userIds)
   */
  notifyUsers(userIds: string[], payload: unknown): Promise<void> {
    if (!Array.isArray(userIds) || userIds.length === 0)
      return Promise.resolve();

    try {
      // Emit to each user's room. Looping is simple and reliable.
      for (const uid of userIds) {
        const room = `user:${uid}`;
        this.server.to(room).emit('notification', payload);
      }
      this.logger.debug(`Notification sent to ${userIds.length} users`);
    } catch (error) {
      this.logger.error('Failed to notify multiple users: ' + String(error));
    }

    return Promise.resolve();
  }

  /**
   * Notify users in parallel with limited concurrency to avoid blocking
   */
  async notifyUsersParallel(
    userIds: string[],
    payload: unknown,
    concurrency = 20,
  ): Promise<void> {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    try {
      const chunks: string[][] = [];
      for (let i = 0; i < userIds.length; i += concurrency) {
        chunks.push(userIds.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        // emit for this chunk (synchronous emit)
        chunk.forEach((uid) =>
          this.server.to(`user:${uid}`).emit('notification', payload),
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
      this.logger.error('Failed to notify users in parallel: ' + String(error));
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(payload: unknown): Promise<void> {
    try {
      this.server.emit('notification', payload);
      this.logger.debug('Notification broadcasted to all connected clients');
    } catch (error) {
      this.logger.error('Failed to broadcast notification: ' + String(error));
    }

    return Promise.resolve();
  }

  /**
   * Send unread count update to specific user
   */
  sendUnreadCountUpdate(userId: string, count: number): Promise<void> {
    try {
      const room = `user:${userId}`;
      this.server.to(room).emit('unreadCountUpdate', { count });
      this.logger.debug(`Unread count update sent to user ${userId}: ${count}`);
    } catch (error) {
      this.logger.error(
        `Failed to send unread count update to user ${userId}: ${String(error)}`,
      );
    }

    return Promise.resolve();
  }

  /**
   * Send notification stats update to specific user
   */
  sendStatsUpdate(userId: string, stats: unknown): Promise<void> {
    try {
      const room = `user:${userId}`;
      this.server.to(room).emit('statsUpdate', stats);
      this.logger.debug(`Stats update sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send stats update to user ${userId}: ${String(error)}`,
      );
    }

    return Promise.resolve();
  }
}
