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
import { NotificationService } from './notification.service';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

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
    private notificationService: NotificationService,
    private jwtService: JwtService,
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
        console.log('Subscribed to Redis channel: notifications');
      }
    });
    this.redisSubscriber.on('message', (channel, message) => {
      console.log(`Received message from ${channel}: ${message}`);
      if (channel === 'notifications') {
        const { targetUserId, notification } = JSON.parse(message);
        // guard server
        if (!this.server) {
          console.warn('Socket server not ready; skipping notify');
          return;
        }
        this.notifyUser(targetUserId, notification);
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

  // Client can acknowledge notification (mark as read)
  @SubscribeMessage('ack')
  async handleAck(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { notificationId } = data || {};
    if (!notificationId) return { success: false };

    try {
      await this.notificationService.update(notificationId, {
        isRead: true,
      } as any);
      return { success: true };
    } catch (err) {
      this.logger.error('Failed to ack notification', err as any);
      return { success: false };
    }
  }

  // Emit notification to a specific user by userId
  async notifyUser(userId: string, payload: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification', payload);
  }

  // Emit notification to multiple users (array of userIds)
  async notifyUsers(userIds: string[], payload: any) {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    // Emit to each user's room. Looping is simple and reliable.
    for (const uid of userIds) {
      const room = `user:${uid}`;
      this.server.to(room).emit('notification', payload);
    }
  }

  // Notify users in parallel with limited concurrency to avoid blocking
  async notifyUsersParallel(userIds: string[], payload: any, concurrency = 20) {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

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
      // Small pause could be added here if needed
    }
  }

  // Broadcast to all connected clients
  async broadcast(payload: any) {
    this.server.emit('notification', payload);
  }
}
