import { Injectable, Logger } from '@nestjs/common';
import { IConnectionManager } from './interfaces';
import { ConnectionEntity } from '../domain/entities';
import { RedisCacheService } from '../../../modules/cache';
import { WEBSOCKET_CONFIG } from '../constants';

@Injectable()
export class ConnectionManagerService implements IConnectionManager {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private connections = new Map<string, ConnectionEntity>(); // socketId -> ConnectionEntity
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly cacheService: RedisCacheService) {
    this.startCleanupProcess();
  }

  async addConnection(
    userId: string,
    socketId: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      [key: string]: any;
    },
  ): Promise<void> {
    try {
      // Check connection limit per user
      const existingConnections = await this.getSocketsByUserId(userId);
      if (
        existingConnections.length >= WEBSOCKET_CONFIG.MAX_CONNECTIONS_PER_USER
      ) {
        throw new Error(`Maximum connections exceeded for user ${userId}`);
      }

      // Create new connection entity
      const connection = new ConnectionEntity(
        userId,
        socketId,
        new Date(),
        metadata?.userAgent,
        metadata?.ipAddress,
        metadata,
      );

      // Store in memory
      this.connections.set(socketId, connection);

      // Update user connections mapping
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(socketId);

      // Cache in Redis for persistence across server restarts
      await this.cacheService.set(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}connection:${socketId}`,
        JSON.stringify(connection.toJSON()),
        WEBSOCKET_CONFIG.REDIS_CONNECTION_TTL,
      );

      // Update user connection list in Redis (using simple array storage)
      const userConnectionsKey = `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}user_connections:${userId}`;
      const existingSockets = await this.getSocketsByUserId(userId);
      if (!existingSockets.includes(socketId)) {
        existingSockets.push(socketId);
      }
      await this.cacheService.set(
        userConnectionsKey,
        existingSockets,
        WEBSOCKET_CONFIG.REDIS_CONNECTION_TTL,
      );

      this.logger.log(
        `Connection added for user ${userId} with socket ${socketId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add connection: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async removeConnection(userId: string, socketId: string): Promise<void> {
    try {
      // Remove from memory
      this.connections.delete(socketId);

      // Update user connections mapping
      const userSockets = this.userConnections.get(userId);
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userConnections.delete(userId);
        }
      }

      // Remove from Redis
      await this.cacheService.del(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}connection:${socketId}`,
      );

      // Update user connections list
      const userConnectionsKey = `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}user_connections:${userId}`;
      const existingSockets =
        (await this.cacheService.get<string[]>(userConnectionsKey)) || [];
      const updatedSockets = existingSockets.filter((id) => id !== socketId);
      if (updatedSockets.length > 0) {
        await this.cacheService.set(
          userConnectionsKey,
          updatedSockets,
          WEBSOCKET_CONFIG.REDIS_CONNECTION_TTL,
        );
      } else {
        await this.cacheService.del(userConnectionsKey);
      }

      this.logger.log(
        `Connection removed for user ${userId} with socket ${socketId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove connection: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async removeAllUserConnections(userId: string): Promise<string[]> {
    try {
      const socketIds = await this.getSocketsByUserId(userId);

      // Remove all connections for this user
      for (const socketId of socketIds) {
        await this.removeConnection(userId, socketId);
      }

      return socketIds;
    } catch (error) {
      this.logger.error(
        `Failed to remove all user connections: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUserBySocketId(socketId: string): Promise<string | null> {
    try {
      // Check memory first
      const connection = this.connections.get(socketId);
      if (connection) {
        return connection.userId;
      }

      // Check Redis if not in memory
      const connectionData = await this.cacheService.get(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}connection:${socketId}`,
      );

      if (connectionData) {
        const parsedConnection = JSON.parse(connectionData);
        return parsedConnection.userId;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get user by socket ID: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async getSocketsByUserId(userId: string): Promise<string[]> {
    try {
      // Check memory first
      const memorySockets = this.userConnections.get(userId);
      if (memorySockets && memorySockets.size > 0) {
        return Array.from(memorySockets);
      }

      // Check Redis
      const redisSockets = await this.cacheService.get<string[]>(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}user_connections:${userId}`,
      );

      return redisSockets || [];
    } catch (error) {
      this.logger.error(
        `Failed to get sockets by user ID: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async isUserConnected(userId: string): Promise<boolean> {
    const sockets = await this.getSocketsByUserId(userId);
    return sockets.length > 0;
  }

  async getConnectionCount(): Promise<number> {
    return this.connections.size;
  }

  async getUserConnectionCount(userId: string): Promise<number> {
    const sockets = await this.getSocketsByUserId(userId);
    return sockets.length;
  }

  async getConnection(socketId: string): Promise<ConnectionEntity | null> {
    try {
      // Check memory first
      const connection = this.connections.get(socketId);
      if (connection) {
        return connection;
      }

      // Check Redis
      const connectionData = await this.cacheService.get(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}connection:${socketId}`,
      );

      if (connectionData) {
        const parsedData = JSON.parse(connectionData);
        return new ConnectionEntity(
          parsedData.userId,
          parsedData.socketId,
          new Date(parsedData.connectedAt),
          parsedData.userAgent,
          parsedData.ipAddress,
          parsedData.metadata,
        );
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get connection: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async getUserConnections(userId: string): Promise<ConnectionEntity[]> {
    try {
      const socketIds = await this.getSocketsByUserId(userId);
      const connections: ConnectionEntity[] = [];

      for (const socketId of socketIds) {
        const connection = await this.getConnection(socketId);
        if (connection) {
          connections.push(connection);
        }
      }

      return connections;
    } catch (error) {
      this.logger.error(
        `Failed to get user connections: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async updateConnectionActivity(socketId: string): Promise<void> {
    try {
      const connection = this.connections.get(socketId);
      if (connection) {
        connection.updateActivity();

        // Update in Redis
        await this.cacheService.set(
          `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}connection:${socketId}`,
          JSON.stringify(connection.toJSON()),
          WEBSOCKET_CONFIG.REDIS_CONNECTION_TTL,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update connection activity: ${error.message}`,
        error.stack,
      );
    }
  }

  async getOnlineUsers(): Promise<string[]> {
    try {
      return Array.from(this.userConnections.keys());
    } catch (error) {
      this.logger.error(
        `Failed to get online users: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async cleanupConnections(): Promise<number> {
    try {
      let cleanedCount = 0;
      const connectionsToRemove: Array<{ userId: string; socketId: string }> =
        [];

      // Check for expired/idle connections
      for (const [socketId, connection] of this.connections.entries()) {
        if (
          connection.isExpired() ||
          connection.isIdle(WEBSOCKET_CONFIG.MAX_CONNECTION_IDLE_TIME)
        ) {
          connectionsToRemove.push({
            userId: connection.userId,
            socketId: socketId,
          });
        }
      }

      // Remove expired connections
      for (const { userId, socketId } of connectionsToRemove) {
        await this.removeConnection(userId, socketId);
        cleanedCount++;
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} expired/idle connections`);
      }

      return cleanedCount;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup connections: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupConnections();
    }, WEBSOCKET_CONFIG.INACTIVE_CONNECTION_CLEANUP_INTERVAL);

    this.logger.log('Connection cleanup process started');
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('Connection cleanup process stopped');
    }
  }
}
