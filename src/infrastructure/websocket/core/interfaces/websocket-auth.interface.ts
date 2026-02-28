import { Socket } from 'socket.io';

export interface IWebSocketAuth {
  /**
   * Validate WebSocket connection and extract user information
   */
  validateConnection(
    client: Socket,
  ): Promise<{ id: string; [key: string]: any } | null>;

  /**
   * Extract authentication token from socket
   */
  extractTokenFromSocket(client: Socket): string | null;

  /**
   * Validate token and return user data
   */
  validateToken(
    token: string,
  ): Promise<{ id: string; [key: string]: any } | null>;

  /**
   * Check if user has permission for a specific action
   */
  hasPermission(
    userId: string,
    action: string,
    resource?: string,
  ): Promise<boolean>;

  /**
   * Get user roles
   */
  getUserRoles(userId: string): Promise<string[]>;

  /**
   * Check if user can access room
   */
  canAccessRoom(userId: string, roomId: string): Promise<boolean>;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  username?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

/**
 * Socket.IO Socket with authenticated user data attached.
 * Set by MainGateway.handleConnection() after JWT verification.
 */
export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: AuthenticatedUser;
}
