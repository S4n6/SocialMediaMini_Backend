import { Injectable } from '@nestjs/common';
import {
  NotificationEntity,
  NotificationType,
  NotificationEntityType,
} from '../notification.entity';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
  NotificationBulkOperationException,
} from '../notification.exceptions';

/**
 * Domain service for complex notification business logic
 */
@Injectable()
export class NotificationDomainService {
  /**
   * Validates if a user can access a notification
   */
  validateNotificationAccess(
    notification: NotificationEntity,
    userId: string,
  ): void {
    if (!notification.isOwnedBy(userId)) {
      throw new UnauthorizedNotificationAccessException(
        notification.id,
        userId,
      );
    }
  }

  /**
   * Validates bulk operation permissions
   */
  validateBulkOperationPermissions(
    notifications: NotificationEntity[],
    userId: string,
  ): void {
    const unauthorizedNotifications = notifications.filter(
      (notification) => !notification.isOwnedBy(userId),
    );

    if (unauthorizedNotifications.length > 0) {
      const unauthorizedIds = unauthorizedNotifications.map((n) => n.id);
      throw new UnauthorizedNotificationAccessException(
        `Multiple notifications: ${unauthorizedIds.join(', ')}`,
        userId,
      );
    }
  }

  /**
   * Determines notification priority based on type
   */
  getNotificationPriority(type: NotificationType): 'high' | 'medium' | 'low' {
    const highPriorityTypes = [
      NotificationType.MESSAGE,
      NotificationType.FRIEND_REQUEST,
    ];

    const mediumPriorityTypes = [
      NotificationType.COMMENT,
      NotificationType.POST_MENTION,
      NotificationType.COMMENT_MENTION,
    ];

    if (highPriorityTypes.includes(type)) {
      return 'high';
    }

    if (mediumPriorityTypes.includes(type)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Checks if notifications should be grouped together
   */
  shouldGroupNotifications(
    notification1: NotificationEntity,
    notification2: NotificationEntity,
  ): boolean {
    // Group notifications of the same type for the same entity
    return (
      notification1.type === notification2.type &&
      notification1.entityId === notification2.entityId &&
      notification1.entityType === notification2.entityType &&
      this.areNotificationsRecent(notification1, notification2)
    );
  }

  /**
   * Checks if notifications are recent enough to be grouped
   */
  private areNotificationsRecent(
    notification1: NotificationEntity,
    notification2: NotificationEntity,
    maxHoursDifference: number = 24,
  ): boolean {
    const timeDifference = Math.abs(
      notification1.createdAt.getTime() - notification2.createdAt.getTime(),
    );
    const maxDifference = maxHoursDifference * 60 * 60 * 1000; // Convert to milliseconds

    return timeDifference <= maxDifference;
  }

  /**
   * Generates notification content based on type and context
   */
  generateNotificationContent(
    type: NotificationType,
    context: {
      actorName?: string;
      entityName?: string;
      customMessage?: string;
    },
  ): { title: string; content: string } {
    switch (type) {
      case NotificationType.LIKE:
        return {
          title: 'New Like',
          content: `${context.actorName} liked your ${context.entityName || 'post'}`,
        };

      case NotificationType.COMMENT:
        return {
          title: 'New Comment',
          content: `${context.actorName} commented on your ${context.entityName || 'post'}`,
        };

      case NotificationType.FOLLOW:
        return {
          title: 'New Follower',
          content: `${context.actorName} started following you`,
        };

      case NotificationType.MESSAGE:
        return {
          title: 'New Message',
          content: `${context.actorName} sent you a message`,
        };

      case NotificationType.POST_MENTION:
        return {
          title: 'You were mentioned',
          content: `${context.actorName} mentioned you in a post`,
        };

      case NotificationType.COMMENT_MENTION:
        return {
          title: 'You were mentioned',
          content: `${context.actorName} mentioned you in a comment`,
        };

      case NotificationType.FRIEND_REQUEST:
        return {
          title: 'Friend Request',
          content: `${context.actorName} sent you a friend request`,
        };

      case NotificationType.BIRTHDAY:
        return {
          title: 'Birthday Reminder',
          content: `It's ${context.actorName}'s birthday today!`,
        };

      case NotificationType.POST_SHARE:
        return {
          title: 'Post Shared',
          content: `${context.actorName} shared your ${context.entityName || 'post'}`,
        };

      case NotificationType.SYSTEM:
        return {
          title: 'System Notification',
          content:
            context.customMessage || 'You have a new system notification',
        };

      default:
        return {
          title: 'New Notification',
          content: context.customMessage || 'You have a new notification',
        };
    }
  }

  /**
   * Determines if notification should be sent in real-time
   */
  shouldSendRealTime(type: NotificationType): boolean {
    const realTimeTypes = [
      NotificationType.MESSAGE,
      NotificationType.FRIEND_REQUEST,
      NotificationType.COMMENT,
      NotificationType.POST_MENTION,
      NotificationType.COMMENT_MENTION,
    ];

    return realTimeTypes.includes(type);
  }

  /**
   * Determines if notification should be sent via email
   */
  shouldSendEmail(type: NotificationType): boolean {
    const emailTypes = [
      NotificationType.FRIEND_REQUEST,
      NotificationType.MESSAGE,
      NotificationType.SYSTEM,
    ];

    return emailTypes.includes(type);
  }

  /**
   * Determines if notification should be sent via push notification
   */
  shouldSendPush(type: NotificationType): boolean {
    // Most notifications should be sent via push, except system ones
    return type !== NotificationType.SYSTEM;
  }

  /**
   * Calculates notification digest summary
   */
  createNotificationDigest(notifications: NotificationEntity[]): {
    totalCount: number;
    unreadCount: number;
    typeBreakdown: Record<NotificationType, number>;
    priorityBreakdown: Record<'high' | 'medium' | 'low', number>;
  } {
    const digest = {
      totalCount: notifications.length,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      typeBreakdown: {} as Record<NotificationType, number>,
      priorityBreakdown: { high: 0, medium: 0, low: 0 },
    };

    notifications.forEach((notification) => {
      // Count by type
      if (!digest.typeBreakdown[notification.type]) {
        digest.typeBreakdown[notification.type] = 0;
      }
      digest.typeBreakdown[notification.type]++;

      // Count by priority
      const priority = this.getNotificationPriority(notification.type);
      digest.priorityBreakdown[priority]++;
    });

    return digest;
  }
}
