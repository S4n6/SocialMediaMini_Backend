import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  IWebSocketEventEmitter,
  IWebSocketEvent,
} from './websocket-event.interface';
import { RoomType } from './websocket-event.types';

/**
 * WebSocket Event Emitter
 * Centralized service for emitting events to WebSocket clients
 */
@Injectable()
export class WebSocketEventEmitter implements IWebSocketEventEmitter {
  private server: Server;
  private readonly logger = new Logger(WebSocketEventEmitter.name);

  /**
   * Set the Socket.IO server instance
   * Called by the main gateway after initialization
   */
  setServer(server: Server): void {
    this.server = server;
    this.logger.log('WebSocket server instance registered');
  }

  /**
   * Emit event to specific user
   */
  async emitToUser(userId: string, event: IWebSocketEvent): Promise<void> {
    if (!this.server) {
      this.logger.error('Server not initialized');
      return;
    }

    const roomId = this.getUserRoom(userId);
    this.server.to(roomId).emit(event.type, event.payload);

    this.logger.debug(`Event ${event.type} emitted to user ${userId}`);
  }

  /**
   * Emit event to specific room
   */
  async emitToRoom(roomId: string, event: IWebSocketEvent): Promise<void> {
    if (!this.server) {
      this.logger.error('Server not initialized');
      return;
    }

    this.server.to(roomId).emit(event.type, event.payload);

    this.logger.debug(`Event ${event.type} emitted to room ${roomId}`);
  }

  /**
   * Emit event to multiple users
   */
  async emitToUsers(userIds: string[], event: IWebSocketEvent): Promise<void> {
    if (!this.server) {
      this.logger.error('Server not initialized');
      return;
    }

    const rooms = userIds.map((id) => this.getUserRoom(id));
    rooms.forEach((room) => {
      this.server.to(room).emit(event.type, event.payload);
    });

    this.logger.debug(`Event ${event.type} emitted to ${userIds.length} users`);
  }

  /**
   * Broadcast event to all connected clients
   */
  async broadcast(event: IWebSocketEvent): Promise<void> {
    if (!this.server) {
      this.logger.error('Server not initialized');
      return;
    }

    this.server.emit(event.type, event.payload);

    this.logger.debug(`Event ${event.type} broadcasted to all clients`);
  }

  /**
   * Get user's personal room ID
   */
  private getUserRoom(userId: string): string {
    return `${RoomType.USER}:${userId}`;
  }

  /**
   * Check if server is initialized
   */
  isReady(): boolean {
    return !!this.server;
  }
}
