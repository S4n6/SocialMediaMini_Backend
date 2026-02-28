import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ConnectionManagerService } from './connection-manager.service';
import { RoomManagerService } from './room-manager.service';
import { WebSocketAuthService } from './websocket-auth.service';
import { PresenceService } from './presence.service';
import { WebSocketEventEmitter } from '../events';
import { RoomType } from '../events/websocket-event.types';

/**
 * Main WebSocket Gateway
 * Handles core WebSocket functionality: connections, authentication, rooms
 * Feature-specific logic should be in feature modules (notification, messaging, comments)
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
@Injectable()
export class MainGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MainGateway.name);

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
    private readonly authService: WebSocketAuthService,
    private readonly eventEmitter: WebSocketEventEmitter,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Called after gateway initialization
   */
  afterInit(server: Server) {
    // Register server with event emitter
    this.eventEmitter.setServer(server);
    this.logger.log('🚀 WebSocket Gateway initialized');
  }

  /**
   * Handle new client connections
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(
        `New connection attempt: ${client.id} from ${this.getClientIP(client)}`,
      );

      // Authenticate user
      const user = await this.authService.validateConnection(client);
      if (!user) {
        this.logger.warn(`Authentication failed for socket ${client.id}`);
        client.emit('error', { message: 'Authentication failed' });
        client.disconnect(true);
        return;
      }

      // Attach user info to socket
      (client as any).userId = user.id;
      (client as any).user = user;

      // Register connection
      await this.connectionManager.addConnection(user.id, client.id, {
        userAgent: client.handshake.headers['user-agent'],
        ipAddress: this.getClientIP(client),
      });

      // Auto-join user's personal room
      const userRoom = `${RoomType.USER}:${user.id}`;
      await client.join(userRoom);
      await this.roomManager.joinRoom(userRoom, client.id, user.id);

      // Track online presence (Redis-backed, survives across instances)
      await this.presenceService.setOnline(user.id);

      // Emit connection success
      client.emit('connected', {
        socketId: client.id,
        userId: user.id,
        timestamp: Date.now(),
      });

      this.logger.log(`✅ User ${user.id} connected (socket: ${client.id})`);
    } catch (error) {
      this.logger.error(
        `Connection error for ${client.id}: ${error.message}`,
        error.stack,
      );
      client.emit('error', { message: 'Connection failed' });
      client.disconnect(true);
    }
  }

  /**
   * Handle client disconnections
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = (client as any).userId;
      this.logger.log(`Client ${client.id} disconnecting (user: ${userId})`);

      if (userId) {
        // Remove connection
        await this.connectionManager.removeConnection(userId, client.id);

        // Leave all rooms
        await this.roomManager.leaveAllRooms(client.id);

        // Only mark offline if this was the user's LAST connection
        const isStillConnected =
          await this.connectionManager.isUserConnected(userId);
        if (!isStillConnected) {
          await this.presenceService.setOffline(userId);
        }
      }

      this.logger.log(`✅ Client ${client.id} disconnected`);
    } catch (error) {
      this.logger.error(
        `Disconnect error for ${client.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(client: Socket): string {
    return (
      (client.handshake.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      client.handshake.address ||
      'unknown'
    );
  }

  /**
   * Get Socket.IO server instance
   * Used by event emitter and other services
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * @deprecated Use WebSocketEventEmitter.emitToRoom() instead
   * Temporary method for backward compatibility
   */
  async broadcastToRoom(
    roomId: string,
    event: string,
    data: any,
  ): Promise<void> {
    this.server.to(roomId).emit(event, data);
  }

  /**
   * @deprecated Use WebSocketEventEmitter.broadcast() instead
   * Temporary method for backward compatibility
   */
  async broadcastToAll(event: string, data: any): Promise<void> {
    this.server.emit(event, data);
  }
}
