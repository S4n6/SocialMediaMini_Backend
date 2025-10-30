import { ConnectionEntity } from '../../domain/entities';

export interface IConnectionManager {
  /**
   * Add a new connection for a user
   */
  addConnection(
    userId: string,
    socketId: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      [key: string]: any;
    },
  ): Promise<void>;

  /**
   * Remove a connection for a user
   */
  removeConnection(userId: string, socketId: string): Promise<void>;

  /**
   * Remove all connections for a user
   */
  removeAllUserConnections(userId: string): Promise<string[]>;

  /**
   * Get user ID by socket ID
   */
  getUserBySocketId(socketId: string): Promise<string | null>;

  /**
   * Get all socket IDs for a user
   */
  getSocketsByUserId(userId: string): Promise<string[]>;

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): Promise<boolean>;

  /**
   * Get total number of connections
   */
  getConnectionCount(): Promise<number>;

  /**
   * Get number of connections for a specific user
   */
  getUserConnectionCount(userId: string): Promise<number>;

  /**
   * Get connection entity by socket ID
   */
  getConnection(socketId: string): Promise<ConnectionEntity | null>;

  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): Promise<ConnectionEntity[]>;

  /**
   * Update connection activity
   */
  updateConnectionActivity(socketId: string): Promise<void>;

  /**
   * Get all online users
   */
  getOnlineUsers(): Promise<string[]>;

  /**
   * Clean up expired/idle connections
   */
  cleanupConnections(): Promise<number>;
}
