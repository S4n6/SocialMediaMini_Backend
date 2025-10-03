import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

import { ConnectionManagerService } from './connection-manager.service';
import { RoomManagerService } from './room-manager.service';

@Injectable()
export class WebSocketUtilityService {
  private readonly logger = new Logger(WebSocketUtilityService.name);
  private server: Server;

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  getConnectionStats(): {
    connections: unknown;
    rooms: unknown;
    server: { connectedClients: number; uptime: number };
    timestamp: Date;
  } {
    const connectionStats = this.connectionManager.getStats() as unknown;
    const roomStats = this.roomManager.getRoomStats() as unknown;

    return {
      connections: connectionStats,
      rooms: roomStats,
      server: {
        connectedClients: this.server.engine.clientsCount,
        uptime: process.uptime(),
      },
      timestamp: new Date(),
    };
  }

  healthCheck(): { healthy: boolean; details: unknown } {
    const connectionHealth = this.connectionManager.healthCheck();
    const roomHealth = this.roomManager.healthCheck();

    const healthy = connectionHealth.healthy && roomHealth.healthy;

    return {
      healthy,
      details: {
        connections: connectionHealth.details as unknown,
        rooms: roomHealth.details as unknown,
        server: {
          connected: this.server.engine.clientsCount >= 0,
        },
      },
    };
  }

  validateToken(token: string): string | null {
    try {
      void token;
      // This should use your JWT service to validate the token
      // For now, returning a mock implementation
      // You should inject and use your JWT service here

      // Example:
      // const payload = await this.jwtService.verifyAsync(token);
      // return payload.sub || payload.userId;

      // Mock implementation - replace with actual JWT validation
      return 'mock-user-id';
    } catch (error) {
      this.logger.error('Token validation error:', error);
      return null;
    }
  }
}
