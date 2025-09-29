import { Injectable } from '@nestjs/common';
import { NotificationType } from '../../domain';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
}

export interface IPushNotificationService {
  sendPushNotification(payload: PushNotificationPayload): Promise<boolean>;
  sendBulkPushNotifications(
    payloads: PushNotificationPayload[],
  ): Promise<boolean[]>;
  registerDeviceToken(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<void>;
  unregisterDeviceToken(userId: string, deviceToken: string): Promise<void>;
}

/**
 * Mock implementation of push notification service
 * In production, this would integrate with Firebase Cloud Messaging, Apple Push Notification Service, etc.
 */
@Injectable()
export class PushNotificationService implements IPushNotificationService {
  private readonly deviceTokens = new Map<
    string,
    { token: string; platform: string }[]
  >();

  async sendPushNotification(
    payload: PushNotificationPayload,
  ): Promise<boolean> {
    try {
      const userTokens = this.deviceTokens.get(payload.userId) || [];

      if (userTokens.length === 0) {
        console.log(`[PUSH] No device tokens found for user ${payload.userId}`);
        return true; // Not an error, just no devices to notify
      }

      console.log(
        `[PUSH] Sending push notification to ${userTokens.length} devices for user ${payload.userId}`,
      );
      console.log(`[PUSH] Title: ${payload.title}`);
      console.log(`[PUSH] Body: ${payload.body}`);
      console.log(`[PUSH] Type: ${payload.type}`);

      // In production, send to actual push notification services
      for (const deviceToken of userTokens) {
        await this.sendToDevice(
          deviceToken.token,
          deviceToken.platform,
          payload,
        );
      }

      return true;
    } catch (error) {
      console.error(
        `[PUSH] Failed to send push notification to user ${payload.userId}:`,
        error,
      );
      return false;
    }
  }

  async sendBulkPushNotifications(
    payloads: PushNotificationPayload[],
  ): Promise<boolean[]> {
    console.log(
      `[PUSH] Sending bulk push notifications (${payloads.length} notifications)`,
    );

    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendPushNotification(payload)),
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : false,
    );
  }

  async registerDeviceToken(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<void> {
    const userTokens = this.deviceTokens.get(userId) || [];

    // Remove existing token if it exists
    const existingIndex = userTokens.findIndex((t) => t.token === deviceToken);
    if (existingIndex >= 0) {
      userTokens.splice(existingIndex, 1);
    }

    // Add new token
    userTokens.push({ token: deviceToken, platform });
    this.deviceTokens.set(userId, userTokens);

    console.log(
      `[PUSH] Registered device token for user ${userId}, platform: ${platform}`,
    );
  }

  async unregisterDeviceToken(
    userId: string,
    deviceToken: string,
  ): Promise<void> {
    const userTokens = this.deviceTokens.get(userId) || [];
    const filteredTokens = userTokens.filter((t) => t.token !== deviceToken);

    if (filteredTokens.length === 0) {
      this.deviceTokens.delete(userId);
    } else {
      this.deviceTokens.set(userId, filteredTokens);
    }

    console.log(`[PUSH] Unregistered device token for user ${userId}`);
  }

  private async sendToDevice(
    deviceToken: string,
    platform: string,
    payload: PushNotificationPayload,
  ): Promise<void> {
    // Simulate different platform handling
    console.log(
      `[PUSH] Sending to ${platform} device: ${deviceToken.substring(0, 10)}...`,
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // In production, this would make actual API calls to:
    // - Firebase Cloud Messaging for Android/Web
    // - Apple Push Notification Service for iOS
    // - Windows Notification Service for Windows
  }

  /**
   * Get notification priority based on type
   */
  getNotificationPriority(type: NotificationType): 'high' | 'normal' | 'low' {
    const highPriorityTypes = [
      NotificationType.MESSAGE,
      NotificationType.FRIEND_REQUEST,
      NotificationType.SYSTEM,
    ];

    const normalPriorityTypes = [
      NotificationType.COMMENT,
      NotificationType.POST_MENTION,
      NotificationType.COMMENT_MENTION,
    ];

    if (highPriorityTypes.includes(type)) {
      return 'high';
    }

    if (normalPriorityTypes.includes(type)) {
      return 'normal';
    }

    return 'low';
  }

  /**
   * Generate push notification payload from notification data
   */
  generatePushPayload(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    metadata?: Record<string, any>,
  ): PushNotificationPayload {
    return {
      userId,
      title,
      body: content,
      type,
      data: {
        type,
        ...metadata,
      },
      badge: 1, // This would typically be the actual unread count
      sound: this.getNotificationSound(type),
      icon: this.getNotificationIcon(type),
    };
  }

  private getNotificationSound(type: NotificationType): string {
    switch (type) {
      case NotificationType.MESSAGE:
        return 'message.wav';
      case NotificationType.FRIEND_REQUEST:
        return 'friend_request.wav';
      case NotificationType.SYSTEM:
        return 'system.wav';
      default:
        return 'default.wav';
    }
  }

  private getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.LIKE:
        return 'ic_like';
      case NotificationType.COMMENT:
        return 'ic_comment';
      case NotificationType.FOLLOW:
        return 'ic_follow';
      case NotificationType.MESSAGE:
        return 'ic_message';
      case NotificationType.FRIEND_REQUEST:
        return 'ic_friend_request';
      default:
        return 'ic_notification';
    }
  }
}
