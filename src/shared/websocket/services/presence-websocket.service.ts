import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import {
  WebSocketEvent,
  WebSocketNamespace,
} from '../interfaces/websocket.interface';
import { RoomManagerService } from '../core/room-manager.service';
import { ConnectionManagerService } from '../core/connection-manager.service';

export interface PresenceEventData {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  device?: string;
  location?: string;
}

export interface ActivityEventData {
  userId: string;
  activity: 'viewing_post' | 'browsing_feed' | 'in_conversation' | 'idle';
  targetId?: string; // postId, conversationId, etc.
  timestamp: Date;
}

@Injectable()
export class PresenceWebSocketService {
  private readonly logger = new Logger(PresenceWebSocketService.name);
  private server: Server;

  // Store user presence data in memory (in production, use Redis)
  private userPresence = new Map<string, PresenceEventData>();
  private userActivities = new Map<string, ActivityEventData>();

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
  ) {}

  // Set server instance from gateway
  setServer(server: Server): void {
    this.server = server;
  }

  // ============ HELPER METHODS ============

  /**
   * Broadcast to namespace
   */
  private broadcastToNamespace(
    namespace: WebSocketNamespace,
    event: WebSocketEvent,
    data: unknown,
  ): void {
    try {
      this.server.emit(event, data as any);
    } catch (error) {
      this.logger.error(`Error broadcasting to namespace ${namespace}:`, error);
    }
  }

  /**
   * Emit to specific user
   */
  private emitToUser(
    userId: string,
    event: WebSocketEvent,
    data: unknown,
  ): boolean {
    try {
      const connections =
        this.connectionManager.getUserConnectionsAsync(userId);

      if (connections.length === 0) {
        this.logger.debug(`No connections found for user ${userId}`);
        return false;
      }

      let emitted = false;
      for (const connection of connections) {
        try {
          this.server.to(connection.socketId).emit(event, data as any);
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

  // ============ WEBSOCKET EVENT HANDLERS ============

  /**
   * Handle update status event from client
   */
  handleUpdateStatus(
    client: Socket,
    data: { status: 'online' | 'offline' | 'away' | 'busy' },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      const presenceData = {
        userId: connection.userId,
        status: data.status,
        timestamp: new Date(),
      };

      // Broadcast to presence namespace
      this.broadcastToNamespace(
        WebSocketNamespace.PRESENCE,
        WebSocketEvent.USER_STATUS_CHANGE,
        presenceData,
      );

      client.emit('status_updated', presenceData);
    } catch (error) {
      this.logger.error('Error updating status:', error);
      client.emit('error', { message: 'Failed to update status' });
    }
  }

  /**
   * Handle update activity event from client
   */
  handleUpdateActivity(
    client: Socket,
    data: {
      activity: 'viewing_post' | 'browsing_feed' | 'in_conversation' | 'idle';
      targetId?: string;
    },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      this.connectionManager.updateUserActivity(connection.userId);

      const activityData = {
        userId: connection.userId,
        activity: data.activity,
        targetId: data.targetId,
        timestamp: new Date(),
      };

      // Broadcast activity update
      this.broadcastToNamespace(
        WebSocketNamespace.PRESENCE,
        WebSocketEvent.PRESENCE_UPDATED,
        activityData,
      );
    } catch (error) {
      this.logger.error('Error updating activity:', error);
    }
  }

  /**
   * Handle get online users event from client
   */
  handleGetOnlineUsers(client: Socket) {
    try {
      const onlineUsers = this.getOnlineUsers();
      client.emit('online_users', {
        users: onlineUsers,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error getting online users:', error);
      client.emit('error', { message: 'Failed to get online users' });
    }
  }

  // ============ BUSINESS LOGIC METHODS ============

  /**
   * Update user presence status
   */
  updatePresence(data: PresenceEventData): void {
    try {
      const previousPresence = this.userPresence.get(data.userId);
      this.userPresence.set(data.userId, data);

      // Only broadcast if status actually changed
      if (!previousPresence || previousPresence.status !== data.status) {
        let event: WebSocketEvent;

        switch (data.status) {
          case 'online':
            event = WebSocketEvent.USER_ONLINE;
            break;
          case 'offline':
            event = WebSocketEvent.USER_OFFLINE;
            break;
          default:
            event = WebSocketEvent.USER_STATUS_CHANGE;
        }

        // Broadcast to presence namespace
        this.broadcastToNamespace(WebSocketNamespace.PRESENCE, event, data);

        // Also notify friends/contacts specifically
        this.notifyContacts(data.userId, event, data);
      }

      this.logger.debug(
        `Presence updated for user ${data.userId}: ${data.status}`,
      );
    } catch (error) {
      this.logger.error('Error updating presence:', error);
    }
  }

  /**
   * Update user activity
   */
  updateActivity(data: ActivityEventData): void {
    try {
      this.userActivities.set(data.userId, data);

      // Broadcast activity updates to interested parties
      this.broadcastToNamespace(
        WebSocketNamespace.PRESENCE,
        WebSocketEvent.PRESENCE_UPDATED,
        {
          userId: data.userId,
          activity: data.activity,
          targetId: data.targetId,
          timestamp: data.timestamp,
        },
      );

      this.logger.debug(
        `Activity updated for user ${data.userId}: ${data.activity}`,
      );
    } catch (error) {
      this.logger.error('Error updating activity:', error);
    }
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): PresenceEventData | null {
    return this.userPresence.get(userId) || null;
  }

  /**
   * Get user activity
   */
  getUserActivity(userId: string): ActivityEventData | null {
    return this.userActivities.get(userId) || null;
  }

  /**
   * Get online users
   */
  getOnlineUsers(): string[] {
    const onlineUsers: string[] = [];

    this.userPresence.forEach((presence, userId) => {
      if (presence.status === 'online') {
        onlineUsers.push(userId);
      }
    });

    return onlineUsers;
  }

  /**
   * Handle user connection
   */
  handleUserConnected(
    userId: string,
    socketId: string,
    metadata?: unknown,
  ): void {
    try {
      // Update presence to online
      const md =
        (metadata as { device?: string; location?: string } | undefined) ??
        undefined;
      this.updatePresence({
        userId,
        status: 'online',
        device: md?.device,
        location: md?.location,
      });

      // Join presence room
      const presenceRoom = this.roomManager.createUserRoom(
        userId,
        WebSocketNamespace.PRESENCE,
      );
      this.roomManager.joinRoom(presenceRoom.id, userId, socketId);

      this.logger.debug(`User ${userId} connected to presence service`);
    } catch (error) {
      this.logger.error('Error handling user connected:', error);
    }
  }

  /**
   * Handle user disconnection
   */
  handleUserDisconnected(userId: string, socketId: string): void {
    try {
      // Check if user has other active connections
      // If not, mark as offline
      const hasOtherConnections = this.checkOtherConnections(userId, socketId);

      if (!hasOtherConnections) {
        this.updatePresence({
          userId,
          status: 'offline',
          lastSeen: new Date(),
        });

        // Clean up activity data
        this.userActivities.delete(userId);
      }

      this.logger.debug(`User ${userId} disconnected from presence service`);
    } catch (error) {
      this.logger.error('Error handling user disconnected:', error);
    }
  }

  /**
   * Set user as away (after inactivity)
   */
  setUserAway(userId: string): void {
    try {
      const currentPresence = this.userPresence.get(userId);

      if (currentPresence && currentPresence.status === 'online') {
        this.updatePresence({
          ...currentPresence,
          status: 'away',
        });
      }
    } catch (error) {
      this.logger.error('Error setting user away:', error);
    }
  }

  /**
   * Cleanup old presence data
   */
  cleanup(): void {
    const now = new Date();
    const threshold = 15 * 60 * 1000; // 15 minutes

    this.userPresence.forEach((presence, userId) => {
      if (presence.status === 'offline' && presence.lastSeen) {
        if (now.getTime() - presence.lastSeen.getTime() > threshold) {
          this.userPresence.delete(userId);
          this.userActivities.delete(userId);
        }
      }
    });
  }

  /**
   * Notify user's contacts about presence changes
   */
  private notifyContacts(
    userId: string,
    event: WebSocketEvent,
    data: PresenceEventData,
  ): void {
    try {
      // In a real app, you'd fetch the user's contacts/friends from database
      // For demo purposes, we'll just broadcast to a contacts room
      const contactsRoom = `contacts:${userId}`;
      this.server.to(contactsRoom).emit(event, data);
    } catch (error) {
      this.logger.error('Error notifying contacts:', error);
    }
  }

  /**
   * Check if user has other active connections
   */
  private checkOtherConnections(
    userId: string,
    excludeSocketId: string,
  ): boolean {
    try {
      // parameters present for future implementation - mark as used to satisfy linter
      void userId;
      void excludeSocketId;
      // This should check with ConnectionManagerService
      // For now, return false to simulate single connection
      return false;
    } catch (error) {
      this.logger.error('Error checking other connections:', error);
      return false;
    }
  }
}
