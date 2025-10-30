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
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  ConnectionManagerService,
  RoomManagerService,
  WebSocketAuthService,
  WebSocketHandlerRegistry,
  WebSocketEventDispatcher,
} from './application/services';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
@Injectable()
export class MainWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MainWebSocketGateway.name);

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
    private readonly authService: WebSocketAuthService,
    private readonly handlerRegistry: WebSocketHandlerRegistry,
    private readonly eventDispatcher: WebSocketEventDispatcher,
  ) {}

  /**
   * Handle new client connections
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(
        `New connection attempt from ${client.id} (IP: ${this.getClientIP(client)})`,
      );

      // Authenticate and setup connection
      const success = await this.eventDispatcher.handleConnection(client);

      if (!success) {
        this.logger.warn(`Connection rejected for ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Emit connection success event
      client.emit('connected', {
        socketId: client.id,
        userId: (client as any).userId,
        timestamp: Date.now(),
      });

      this.logger.log(
        `Client ${client.id} connected successfully as user ${(client as any).userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection error for ${client.id}: ${error.message}`,
        error.stack,
      );
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

      // Handle disconnection cleanup
      await this.eventDispatcher.handleDisconnection(client);

      // Leave all rooms
      await this.roomManager.leaveAllRooms(client.id);

      this.logger.log(`Client ${client.id} disconnected successfully`);
    } catch (error) {
      this.logger.error(
        `Disconnect error for ${client.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle all WebSocket events through the dispatcher
   */
  @SubscribeMessage('*')
  async handleEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): Promise<void> {
    try {
      // Check if client is authenticated
      if (!(client as any).isAuthenticated) {
        client.emit('error', {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: Date.now(),
        });
        return;
      }

      // Dispatch event to appropriate handler
      await this.eventDispatcher.dispatchEvent(client, data);
    } catch (error) {
      this.logger.error(
        `Event handling error for ${client.id}: ${error.message}`,
        error.stack,
      );

      client.emit('error', {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: Date.now(),
        requestId: data?.requestId,
      });
    }
  }

  /**
   * Handle room join requests
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; password?: string },
  ): Promise<void> {
    try {
      const userId = (client as any).userId;

      if (!userId) {
        client.emit('join_room:error', {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      // Check room access permissions
      const canAccess = await this.authService.canAccessRoom(
        userId,
        data.roomId,
      );
      if (!canAccess) {
        client.emit('join_room:error', {
          success: false,
          error: {
            code: 'ROOM_ACCESS_DENIED',
            message: 'Access denied to room',
          },
        });
        return;
      }

      // Join room
      await client.join(data.roomId);
      await this.roomManager.joinRoom(data.roomId, client.id, userId);

      client.emit('join_room:success', {
        success: true,
        data: { roomId: data.roomId },
        timestamp: Date.now(),
      });

      // Notify room about new member (optional)
      client.to(data.roomId).emit('room:user_joined', {
        roomId: data.roomId,
        userId: userId,
        timestamp: Date.now(),
      });

      this.logger.log(`User ${userId} joined room ${data.roomId}`);
    } catch (error) {
      this.logger.error(`Join room error: ${error.message}`, error.stack);

      client.emit('join_room:error', {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to join room' },
      });
    }
  }

  /**
   * Handle room leave requests
   */
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    try {
      const userId = (client as any).userId;

      // Leave room
      await client.leave(data.roomId);
      await this.roomManager.leaveRoom(data.roomId, client.id, userId);

      client.emit('leave_room:success', {
        success: true,
        data: { roomId: data.roomId },
        timestamp: Date.now(),
      });

      // Notify room about member leaving (optional)
      client.to(data.roomId).emit('room:user_left', {
        roomId: data.roomId,
        userId: userId,
        timestamp: Date.now(),
      });

      this.logger.log(`User ${userId} left room ${data.roomId}`);
    } catch (error) {
      this.logger.error(`Leave room error: ${error.message}`, error.stack);

      client.emit('leave_room:error', {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to leave room' },
      });
    }
  }

  /**
   * Handle ping requests for connection health check
   */
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      await this.connectionManager.updateConnectionActivity(client.id);

      client.emit('pong', {
        timestamp: Date.now(),
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Ping error: ${error.message}`, error.stack);
    }
  }

  /**
   * Get gateway statistics
   */
  async getStats() {
    try {
      const connectionCount = await this.connectionManager.getConnectionCount();
      const roomCount = await this.roomManager.getRoomCount();
      const onlineUsers = await this.connectionManager.getOnlineUsers();
      const dispatcherStats = this.eventDispatcher.getStats();
      const handlerStats = this.handlerRegistry.getHandlerStats();

      return {
        connections: {
          total: connectionCount,
          uniqueUsers: onlineUsers.length,
        },
        rooms: {
          total: roomCount,
        },
        handlers: {
          registered: handlerStats.totalHandlers,
          byModule: Object.fromEntries(handlerStats.moduleBreakdown),
        },
        dispatcher: dispatcherStats,
        uptime: process.uptime(),
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Broadcast message to specific room
   */
  async broadcastToRoom(
    roomId: string,
    event: string,
    data: any,
    excludeSocketIds?: string[],
  ): Promise<void> {
    try {
      await this.eventDispatcher.broadcastToRoom(
        this.server,
        roomId,
        event,
        data,
        excludeSocketIds,
      );
    } catch (error) {
      this.logger.error(
        `Broadcast to room failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast message to specific user
   */
  async broadcastToUser(
    userId: string,
    event: string,
    data: any,
  ): Promise<void> {
    try {
      await this.eventDispatcher.broadcastToUser(
        this.server,
        userId,
        event,
        data,
      );
    } catch (error) {
      this.logger.error(
        `Broadcast to user failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast to all connected clients
   */
  async broadcastToAll(event: string, data: any): Promise<void> {
    try {
      this.server.emit(event, data);
      this.logger.debug(`Broadcasted ${event} to all clients`);
    } catch (error) {
      this.logger.error(
        `Broadcast to all failed: ${error.message}`,
        error.stack,
      );
    }
  }

  private getClientIP(client: Socket): string {
    return (client.handshake.headers['x-forwarded-for'] ||
      client.handshake.headers['x-real-ip'] ||
      client.handshake.address ||
      'unknown') as string;
  }

  /**
   * Lifecycle hook - cleanup on module destroy
   */
  onModuleDestroy() {
    this.logger.log('WebSocket Gateway shutting down...');

    if (this.server) {
      this.server.close(() => {
        this.logger.log('WebSocket server closed');
      });
    }
  }
}
