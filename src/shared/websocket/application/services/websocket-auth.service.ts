import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { IWebSocketAuth, AuthenticatedUser } from '../interfaces';

@Injectable()
export class WebSocketAuthService implements IWebSocketAuth {
  private readonly logger = new Logger(WebSocketAuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  async validateConnection(client: Socket): Promise<AuthenticatedUser | null> {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`No token provided for socket ${client.id}`);
        return null;
      }

      const user = await this.validateToken(token);
      if (!user) {
        this.logger.warn(`Invalid token for socket ${client.id}`);
        return null;
      }

      this.logger.log(`User ${user.id} authenticated for socket ${client.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Authentication failed for socket ${client.id}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  extractTokenFromSocket(client: Socket): string | null {
    try {
      // Try to get token from various sources

      // 1. From handshake auth
      const authToken = client.handshake.auth?.token;
      if (authToken) {
        return this.cleanToken(authToken);
      }

      // 2. From handshake headers
      const authHeader = client.handshake.headers?.authorization;
      if (authHeader) {
        return this.extractTokenFromAuthHeader(authHeader);
      }

      // 3. From query parameters
      const queryToken = client.handshake.query?.token;
      if (queryToken && typeof queryToken === 'string') {
        return this.cleanToken(queryToken);
      }

      // 4. From cookies (if needed)
      const cookies = client.handshake.headers?.cookie;
      if (cookies) {
        const tokenFromCookie = this.extractTokenFromCookies(cookies);
        if (tokenFromCookie) {
          return tokenFromCookie;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to extract token: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Verify and decode JWT token
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload || !payload.sub) {
        this.logger.warn('Invalid token payload');
        return null;
      }

      // Create authenticated user object
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
        username: payload.username || payload.name,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        // Add any other user data from token
        ...payload,
      };

      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.warn('Invalid token format');
      } else {
        this.logger.error(
          `Token validation error: ${error.message}`,
          error.stack,
        );
      }
      return null;
    }
  }

  async hasPermission(
    userId: string,
    action: string,
    resource?: string,
  ): Promise<boolean> {
    try {
      // This is a basic implementation
      // In a real application, you might check against a database or cache
      // For now, we'll assume all authenticated users have basic permissions

      // You can extend this to check specific permissions based on:
      // - User roles
      // - Resource ownership
      // - Action types
      // - Business logic requirements

      return true; // Allow all actions for authenticated users for now
    } catch (error) {
      this.logger.error(
        `Permission check failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      // This should fetch roles from your user service or database
      // For now, return empty array
      // In production, you might want to:
      // 1. Cache user roles
      // 2. Fetch from user service
      // 3. Include in JWT token

      return []; // Implement based on your user management system
    } catch (error) {
      this.logger.error(
        `Failed to get user roles: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async canAccessRoom(userId: string, roomId: string): Promise<boolean> {
    try {
      // Room access control logic

      // User rooms - users can only access their own rooms
      if (roomId.startsWith('user:')) {
        const roomUserId = roomId.replace('user:', '');
        return roomUserId === userId;
      }

      // Notification rooms - users can only access their own notification rooms
      if (roomId.startsWith('user_notifications:')) {
        const roomUserId = roomId.replace('user_notifications:', '');
        return roomUserId === userId;
      }

      // Conversation rooms - check if user is participant
      if (roomId.startsWith('conversation:')) {
        return await this.canAccessConversation(userId, roomId);
      }

      // Private chat rooms - check if user is one of the participants
      if (roomId.startsWith('private_chat:')) {
        return this.canAccessPrivateChat(userId, roomId);
      }

      // Global rooms - generally accessible to all authenticated users
      if (roomId === 'global_feed' || roomId === 'online_users') {
        return true;
      }

      // Followers rooms - check if user can access (owner or follower)
      if (roomId.startsWith('followers:')) {
        return await this.canAccessFollowersRoom(userId, roomId);
      }

      // Post rooms - generally accessible for post interactions
      if (roomId.startsWith('post:')) {
        return true; // Most posts are public, but you can add privacy checks here
      }

      // Admin rooms - check admin privileges
      if (roomId === 'admin') {
        const roles = await this.getUserRoles(userId);
        return roles.includes('admin') || roles.includes('moderator');
      }

      // Default: deny access to unknown room types
      return false;
    } catch (error) {
      this.logger.error(
        `Room access check failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  private cleanToken(token: string): string {
    return token.replace(/^Bearer\s+/i, '').trim();
  }

  private extractTokenFromAuthHeader(authHeader: string): string | null {
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private extractTokenFromCookies(cookies: string): string | null {
    try {
      const cookieArray = cookies.split(';');
      for (const cookie of cookieArray) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token' || name === 'auth_token' || name === 'jwt') {
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async canAccessConversation(
    userId: string,
    roomId: string,
  ): Promise<boolean> {
    try {
      // Extract conversation ID from room ID
      const conversationId = roomId.replace('conversation:', '');

      // Here you would typically check if the user is a participant in the conversation
      // This would involve querying your conversation/messaging service
      // For now, we'll return true (implement based on your messaging module)

      return true; // Implement conversation participant check
    } catch (error) {
      this.logger.error(
        `Conversation access check failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  private canAccessPrivateChat(userId: string, roomId: string): boolean {
    try {
      // Extract user IDs from private chat room ID
      // Format: private_chat:userId1:userId2
      const parts = roomId.split(':');
      if (parts.length !== 3) return false;

      const [, userId1, userId2] = parts;
      return userId === userId1 || userId === userId2;
    } catch (error) {
      this.logger.error(
        `Private chat access check failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  private async canAccessFollowersRoom(
    userId: string,
    roomId: string,
  ): Promise<boolean> {
    try {
      // Extract target user ID from followers room
      const targetUserId = roomId.replace('followers:', '');

      // User can access their own followers room
      if (targetUserId === userId) {
        return true;
      }

      // Check if user is following the target user
      // This would involve querying your follow service
      // For now, we'll return false (implement based on your follow module)

      return false; // Implement follower check
    } catch (error) {
      this.logger.error(
        `Followers room access check failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
