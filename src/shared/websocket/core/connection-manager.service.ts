import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  UserConnection,
  WebSocketNamespace,
  ConnectionStats,
  IConnectionManager,
} from '../interfaces/websocket.interface';
@Injectable()
export class ConnectionManagerService implements IConnectionManager {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private connections = new Map<string, UserConnection>(); // socketId -> UserConnection
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private namespaceConnections = new Map<WebSocketNamespace, Set<string>>(); // namespace -> Set<socketId>

  addConnection(connection: UserConnection): void {
    this.connections.set(connection.socketId, connection);

    // Track user connections
    if (!this.userConnections.has(connection.userId)) {
      this.userConnections.set(connection.userId, new Set());
    }
    this.userConnections.get(connection.userId)!.add(connection.socketId);

    // Track namespace connections
    if (!this.namespaceConnections.has(connection.namespace)) {
      this.namespaceConnections.set(connection.namespace, new Set());
    }
    this.namespaceConnections
      .get(connection.namespace)!
      .add(connection.socketId);

    this.logger.debug(
      `User ${connection.userId} connected to ${connection.namespace} (socket: ${connection.socketId})`,
    );
  }

  removeConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (!connection) {
      this.logger.warn(
        `Attempted to remove non-existent connection: ${socketId}`,
      );
      return;
    }

    // Remove from connections map
    this.connections.delete(socketId);

    // Remove from user connections
    const userSocketIds = this.userConnections.get(connection.userId);
    if (userSocketIds) {
      userSocketIds.delete(socketId);
      if (userSocketIds.size === 0) {
        this.userConnections.delete(connection.userId);
        this.logger.debug(`User ${connection.userId} fully disconnected`);
      }
    }

    // Remove from namespace connections
    const namespaceSocketIds = this.namespaceConnections.get(
      connection.namespace,
    );
    if (namespaceSocketIds) {
      namespaceSocketIds.delete(socketId);
    }

    this.logger.debug(
      `Removed connection for user ${connection.userId} (socket: ${socketId})`,
    );
  }

  getConnection(socketId: string): UserConnection | undefined {
    return this.connections.get(socketId);
  }

  getUserConnections(userId: string): UserConnection[] {
    const socketIds = this.userConnections.get(userId);
    if (!socketIds) {
      return [];
    }

    return Array.from(socketIds)
      .map((socketId) => this.connections.get(socketId))
      .filter(Boolean) as UserConnection[];
  }

  getAllConnections(): UserConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionsByNamespace(namespace: WebSocketNamespace): UserConnection[] {
    const socketIds = this.namespaceConnections.get(namespace);
    if (!socketIds) {
      return [];
    }

    return Array.from(socketIds)
      .map((socketId) => this.connections.get(socketId))
      .filter(Boolean) as UserConnection[];
  }

  // Helper methods for gateway compatibility
  addConnectionAsync(
    userId: string,
    socketId: string,
    namespace: WebSocketNamespace,
    socket: Socket,
  ): UserConnection {
    const userAgent = String(socket.handshake?.headers?.['user-agent'] ?? '');

    const connection: UserConnection = {
      userId,
      socketId,
      socket,
      namespace,
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        userAgent,
        device: 'web',
      },
    };

    this.addConnection(connection);
    return connection;
  }

  getConnectionBySocket(socketId: string): UserConnection | undefined {
    return this.getConnection(socketId);
  }

  getUserConnectionsAsync(
    userId: string,
    namespace?: WebSocketNamespace,
  ): UserConnection[] {
    let connections = this.getUserConnections(userId);

    if (namespace) {
      connections = connections.filter((conn) => conn.namespace === namespace);
    }

    return connections;
  }

  removeConnectionAsync(userId: string, socketId: string): boolean {
    const connection = this.connections.get(socketId);
    if (connection && connection.userId === userId) {
      this.removeConnection(socketId);
      return true;
    }
    return false;
  }

  updateUserActivity(userId: string): void {
    const connections = this.getUserConnections(userId);
    connections.forEach((connection) => {
      connection.lastActivity = new Date();
    });
  }

  updateLastActivity(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  getStats(): ConnectionStats {
    const totalConnections = this.connections.size;
    const activeUsers = this.userConnections.size;

    const connectionsByNamespace: Partial<Record<WebSocketNamespace, number>> =
      {};
    for (const [namespace, socketIds] of this.namespaceConnections.entries()) {
      connectionsByNamespace[namespace] = socketIds.size;
    }

    return {
      totalConnections,
      connectionsByNamespace: connectionsByNamespace as Record<
        WebSocketNamespace,
        number
      >,
      connectionsByRoom: {}, // Will be populated by RoomManager
      activeUsers,
      messagesPerSecond: 0, // To be implemented with metrics
      averageResponseTime: 0, // To be implemented with metrics
      errorRate: 0, // To be implemented with metrics
      lastUpdated: new Date(),
    };
  }

  // Utility methods
  isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  getNamespaceConnectionCount(namespace: WebSocketNamespace): number {
    return this.namespaceConnections.get(namespace)?.size || 0;
  }

  // Cleanup inactive connections
  cleanupInactiveConnections(maxInactiveMs: number = 300000): number {
    // 5 minutes default
    const now = new Date();
    let removedCount = 0;

    for (const [socketId, connection] of this.connections.entries()) {
      const inactiveMs = now.getTime() - connection.lastActivity.getTime();
      if (inactiveMs > maxInactiveMs) {
        this.removeConnection(socketId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} inactive connections`);
    }

    return removedCount;
  }

  // Get connections by criteria
  getConnectionsByUserId(userIds: string[]): UserConnection[] {
    const connections: UserConnection[] = [];

    for (const userId of userIds) {
      connections.push(...this.getUserConnections(userId));
    }

    return connections;
  }

  // Bulk operations
  removeUserConnections(userId: string): number {
    const userSocketIds = this.userConnections.get(userId);
    if (!userSocketIds) {
      return 0;
    }

    const removedCount = userSocketIds.size;

    // Remove all sockets for the user
    for (const socketId of userSocketIds) {
      const connection = this.connections.get(socketId);
      if (connection) {
        this.connections.delete(socketId);

        // Remove from namespace connections
        const namespaceSocketIds = this.namespaceConnections.get(
          connection.namespace,
        );
        if (namespaceSocketIds) {
          namespaceSocketIds.delete(socketId);
        }
      }
    }

    // Remove user from user connections map
    this.userConnections.delete(userId);

    this.logger.debug(`Removed ${removedCount} connections for user ${userId}`);
    return removedCount;
  }

  // Debug and monitoring methods
  getConnectionInfo(): {
    totalConnections: number;
    totalUsers: number;
    namespaces: Record<string, number>;
    userConnectionCounts: Record<string, number>;
  } {
    const namespaces: Record<string, number> = {};
    for (const [ns, sockets] of this.namespaceConnections.entries()) {
      namespaces[String(ns)] = sockets.size;
    }

    const userConnectionCounts: Record<string, number> = {};
    for (const [userId, sockets] of this.userConnections.entries()) {
      userConnectionCounts[userId] = sockets.size;
    }

    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      namespaces,
      userConnectionCounts,
    };
  }

  // Health check
  healthCheck(): { healthy: boolean; details: any } {
    const stats = this.getStats();
    const connectionInfo = this.getConnectionInfo();

    const healthy =
      stats.totalConnections >= 0 &&
      stats.activeUsers >= 0 &&
      stats.totalConnections >= stats.activeUsers;

    return {
      healthy,
      details: {
        ...stats,
        ...connectionInfo,
        timestamp: new Date(),
      },
    };
  }
}
