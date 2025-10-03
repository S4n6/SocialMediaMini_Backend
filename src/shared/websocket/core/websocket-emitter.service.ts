import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

import { ConnectionManagerService } from './connection-manager.service';
import { RoomManagerService } from './room-manager.service';
import {
  WebSocketEvent,
  WebSocketNamespace,
  WebSocketEventPayload,
} from '../interfaces/websocket.interface';

@Injectable()
export class WebSocketEmitterService {
  private readonly logger = new Logger(WebSocketEmitterService.name);
  private server: Server;

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(
    userId: string,
    event: WebSocketEvent,
    data: unknown,
    namespace?: WebSocketNamespace,
  ): boolean {
    try {
      const connections = this.connectionManager.getUserConnectionsAsync(
        userId,
        namespace,
      );

      if (connections.length === 0) {
        this.logger.debug(
          `No connections found for user ${userId} in namespace ${namespace}`,
        );
        return false;
      }

      const payload: WebSocketEventPayload = {
        event,
        data,
        metadata: {
          timestamp: new Date(),
          eventId: `${Date.now()}-${Math.random()}`,
          version: '1.0',
        },
        namespace: namespace || WebSocketNamespace.SOCIAL,
      };

      let emitted = false;
      for (const connection of connections) {
        try {
          this.server.to(connection.socketId).emit(event, payload);
          emitted = true;
        } catch (error) {
          this.logger.error(
            `Failed to emit to socket ${connection.socketId}:`,
            error,
          );
        }
      }

      return emitted;
    } catch (error) {
      this.logger.error(`Error emitting to user ${userId}:`, error);
      return false;
    }
  }

  emitToRoom(roomId: string, event: WebSocketEvent, data: unknown): boolean {
    try {
      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        this.logger.warn(`Room ${roomId} not found for emission`);
        return false;
      }

      const payload: WebSocketEventPayload<unknown> = {
        event,
        data,
        metadata: {
          timestamp: new Date(),
          eventId: `${Date.now()}-${Math.random()}`,
          version: '1.0',
        },
        namespace: room.namespace,
      };

      this.server.to(roomId).emit(event, payload);
      return true;
    } catch (error) {
      this.logger.error(`Error emitting to room ${roomId}:`, error);
      return false;
    }
  }

  broadcastToNamespace(
    namespace: WebSocketNamespace,
    event: WebSocketEvent,
    data: unknown,
  ): boolean {
    try {
      const payload: WebSocketEventPayload<unknown> = {
        event,
        data,
        metadata: {
          timestamp: new Date(),
          eventId: `${Date.now()}-${Math.random()}`,
          version: '1.0',
        },
        namespace,
      };

      this.server.emit(event, payload);
      return true;
    } catch (error) {
      this.logger.error(`Error broadcasting to namespace ${namespace}:`, error);
      return false;
    }
  }
}
