import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ConnectionManagerService } from './connection-manager.service';
import { RoomManagerService } from './room-manager.service';
import { PresenceWebSocketService } from '../services/presence-websocket.service';
import {
  WebSocketEvent,
  WebSocketNamespace,
} from '../interfaces/websocket.interface';

@Injectable()
export class WebSocketConnectionService {
  private readonly logger = new Logger(WebSocketConnectionService.name);
  private server: Server;

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
    private readonly presenceService: PresenceWebSocketService,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  handleConnection(client: Socket): void {
    try {
      this.logger.debug(`Client attempting connection: ${client.id}`);

      // Extract user info from handshake
      const authToken =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.query?.token as string | undefined);

      if (!authToken) {
        this.logger.warn(`No token provided for client: ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Validate JWT token and extract user info
      const userId = this.validateToken(authToken);

      if (!userId) {
        this.logger.warn(`Invalid token for client: ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Store connection
      const connection = this.connectionManager.addConnectionAsync(
        userId,
        client.id,
        WebSocketNamespace.SOCIAL,
        client,
      );

      if (connection) {
        // setupUserConnection performs some socket join operations which are not necessarily Promise-returning
        // Use void for fire-and-forget and keep the gateway contract
        void this.setupUserConnection(client, userId);
        this.logger.log(`User ${userId} connected with socket ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );

      if (connection) {
        const userId = connection.userId;

        // Notify presence service about user disconnection
        // presenceService handler is synchronous in our current implementation; call directly
        this.presenceService.handleUserDisconnected(userId, client.id);

        // Remove from all rooms
        this.roomManager.removeUserFromAllRooms(userId);

        // Remove connection
        this.connectionManager.removeConnectionAsync(userId, client.id);

        this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
      }
    } catch (error) {
      this.logger.error(`Disconnect error for client ${client.id}:`, error);
    }
  }

  handleJoinRoom(client: Socket, data: { roomId: string }): void {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) {
        client.emit('error', { message: 'Connection not found' });
        return;
      }

      // socket.io join may not return a thenable depending on version; use void to avoid await-thenable lint
      void client.join(data.roomId);
      const joined = this.roomManager.joinRoom(
        data.roomId,
        connection.userId,
        client.id,
      );

      if (joined) {
        client.emit('room_joined', { roomId: data.roomId });
        client.to(data.roomId).emit(WebSocketEvent.USER_JOINED_ROOM, {
          userId: connection.userId,
          roomId: data.roomId,
        });
      }
    } catch (error) {
      this.logger.error(`Error joining room:`, error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  handleLeaveRoom(client: Socket, data: { roomId: string }): void {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) {
        client.emit('error', { message: 'Connection not found' });
        return;
      }

      // socket.io leave may not return a thenable depending on version; use void to avoid await-thenable lint
      void client.leave(data.roomId);
      this.roomManager.leaveRoom(data.roomId, connection.userId, client.id);

      client.emit('room_left', { roomId: data.roomId });
      client.to(data.roomId).emit(WebSocketEvent.USER_LEFT_ROOM, {
        userId: connection.userId,
        roomId: data.roomId,
      });
    } catch (error) {
      this.logger.error(`Error leaving room:`, error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  private setupUserConnection(client: Socket, userId: string): void {
    // Join user's personal room
    const userRoom = this.roomManager.createUserRoom(
      userId,
      WebSocketNamespace.SOCIAL,
    );
    void client.join(userRoom.id);
    this.roomManager.joinRoom(userRoom.id, userId, client.id);

    // Emit connection success
    client.emit(WebSocketEvent.CONNECTION_ESTABLISHED, {
      userId,
      socketId: client.id,
      timestamp: new Date(),
    });

    // Notify presence service about user connection (synchronous)
    this.presenceService.handleUserConnected(userId, client.id, {
      device: String(client.handshake?.headers?.['user-agent'] ?? ''),
    });
  }

  private validateToken(_token: string): string | null {
    try {
      // Mark parameter as used to satisfy linting until real JWT validation is implemented
      void _token;
      // This should use your JWT service to validate the token
      // For now, returning a mock implementation
      // You should inject and use your JWT service here

      // Example:
      // const payload = await this.jwtService.verifyAsync(_token);
      // return payload.sub || payload.userId;

      // Mock implementation - replace with actual JWT validation
      return 'mock-user-id';
    } catch (error) {
      this.logger.error('Token validation error:', error);
      return null;
    }
  }
}
