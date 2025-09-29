import { Injectable } from '@nestjs/common';
import { NotificationResponseDto } from '../../application';
import { NotificationType } from '../../domain';

export interface RealTimeNotificationPayload {
  userId: string;
  notification: NotificationResponseDto;
  type:
    | 'notification_created'
    | 'notification_updated'
    | 'notification_deleted'
    | 'bulk_read';
  timestamp: Date;
}

export interface IRealtimeNotificationService {
  sendToUser(
    userId: string,
    payload: RealTimeNotificationPayload,
  ): Promise<boolean>;
  sendToMultipleUsers(
    userIds: string[],
    payload: Omit<RealTimeNotificationPayload, 'userId'>,
  ): Promise<boolean[]>;
  subscribeUser(userId: string, socketId: string): Promise<void>;
  unsubscribeUser(userId: string, socketId: string): Promise<void>;
  broadcastUnreadCount(userId: string, count: number): Promise<boolean>;
}

/**
 * Real-time notification service using WebSocket/Server-Sent Events
 * This service manages real-time communication with connected clients
 */
@Injectable()
export class RealtimeNotificationService
  implements IRealtimeNotificationService
{
  private readonly userConnections = new Map<string, Set<string>>();

  async sendToUser(
    userId: string,
    payload: RealTimeNotificationPayload,
  ): Promise<boolean> {
    const userSockets = this.userConnections.get(userId);

    if (!userSockets || userSockets.size === 0) {
      console.log(`[REALTIME] No active connections for user ${userId}`);
      return true; // Not an error, user is just offline
    }

    try {
      console.log(
        `[REALTIME] Sending notification to ${userSockets.size} connections for user ${userId}`,
      );
      console.log(`[REALTIME] Type: ${payload.type}`);
      console.log(`[REALTIME] Notification ID: ${payload.notification.id}`);

      // In production, this would emit to actual WebSocket connections
      for (const socketId of userSockets) {
        await this.emitToSocket(socketId, 'notification', payload);
      }

      return true;
    } catch (error) {
      console.error(
        `[REALTIME] Failed to send notification to user ${userId}:`,
        error,
      );
      return false;
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    payload: Omit<RealTimeNotificationPayload, 'userId'>,
  ): Promise<boolean[]> {
    console.log(
      `[REALTIME] Broadcasting notification to ${userIds.length} users`,
    );

    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, { ...payload, userId })),
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : false,
    );
  }

  async subscribeUser(userId: string, socketId: string): Promise<void> {
    const userSockets = this.userConnections.get(userId) || new Set();
    userSockets.add(socketId);
    this.userConnections.set(userId, userSockets);

    console.log(`[REALTIME] User ${userId} connected with socket ${socketId}`);
    console.log(`[REALTIME] Total connections for user: ${userSockets.size}`);

    // Send initial data when user connects
    await this.sendInitialData(userId, socketId);
  }

  async unsubscribeUser(userId: string, socketId: string): Promise<void> {
    const userSockets = this.userConnections.get(userId);

    if (userSockets) {
      userSockets.delete(socketId);

      if (userSockets.size === 0) {
        this.userConnections.delete(userId);
        console.log(`[REALTIME] User ${userId} fully disconnected`);
      } else {
        console.log(
          `[REALTIME] User ${userId} disconnected socket ${socketId}. Remaining connections: ${userSockets.size}`,
        );
      }
    }
  }

  async broadcastUnreadCount(userId: string, count: number): Promise<boolean> {
    const userSockets = this.userConnections.get(userId);

    if (!userSockets || userSockets.size === 0) {
      return true; // User is offline
    }

    try {
      console.log(
        `[REALTIME] Broadcasting unread count ${count} to user ${userId}`,
      );

      for (const socketId of userSockets) {
        await this.emitToSocket(socketId, 'unread_count', {
          count,
          timestamp: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error(
        `[REALTIME] Failed to broadcast unread count to user ${userId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Send typing indicator for message notifications
   */
  async sendTypingIndicator(
    userId: string,
    conversationId: string,
    isTyping: boolean,
  ): Promise<boolean> {
    const userSockets = this.userConnections.get(userId);

    if (!userSockets || userSockets.size === 0) {
      return true;
    }

    try {
      for (const socketId of userSockets) {
        await this.emitToSocket(socketId, 'typing_indicator', {
          conversationId,
          isTyping,
          timestamp: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error(`[REALTIME] Failed to send typing indicator:`, error);
      return false;
    }
  }

  /**
   * Send presence update (online/offline status)
   */
  async broadcastPresenceUpdate(
    userId: string,
    status: 'online' | 'offline' | 'away',
    toUserIds: string[],
  ): Promise<boolean[]> {
    console.log(
      `[REALTIME] Broadcasting presence update for user ${userId} to ${toUserIds.length} users`,
    );

    const results = await Promise.allSettled(
      toUserIds.map(async (targetUserId) => {
        const userSockets = this.userConnections.get(targetUserId);

        if (!userSockets || userSockets.size === 0) {
          return true;
        }

        for (const socketId of userSockets) {
          await this.emitToSocket(socketId, 'presence_update', {
            userId,
            status,
            timestamp: new Date(),
          });
        }

        return true;
      }),
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : false,
    );
  }

  /**
   * Get currently connected users count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get connection count for a specific user
   */
  getUserConnectionCount(userId: string): number {
    const userSockets = this.userConnections.get(userId);
    return userSockets ? userSockets.size : 0;
  }

  /**
   * Check if user is currently connected
   */
  isUserConnected(userId: string): boolean {
    const userSockets = this.userConnections.get(userId);
    return userSockets ? userSockets.size > 0 : false;
  }

  private async emitToSocket(
    socketId: string,
    event: string,
    data: any,
  ): Promise<void> {
    // In production, this would emit to actual WebSocket connection
    console.log(`[REALTIME] Emit to socket ${socketId}: ${event}`, data);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  private async sendInitialData(
    userId: string,
    socketId: string,
  ): Promise<void> {
    try {
      // Send unread count when user connects
      // This would typically fetch from the notification service
      await this.emitToSocket(socketId, 'initial_data', {
        userId,
        connected: true,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(
        `[REALTIME] Failed to send initial data to user ${userId}:`,
        error,
      );
    }
  }
}
