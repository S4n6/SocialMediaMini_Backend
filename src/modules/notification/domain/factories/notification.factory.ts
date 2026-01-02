import {
  NotificationEntity,
  NotificationProps,
} from '../entities/notification.entity';
import {
  NotificationType,
  NotificationEntityType,
} from '../enums/notification.enums';

export interface CreateNotificationParams {
  type: NotificationType;
  userId: string;
  entityId?: string;
  entityType?: NotificationEntityType;
  actorName?: string;
  entityName?: string;
  customTitle?: string;
  customContent?: string;
}

/**
 * Pure factory for creating notification entities
 * No framework dependencies, pure domain logic
 */
export class NotificationFactory {
  /**
   * Creates a new notification entity
   */
  createNotification(params: CreateNotificationParams): NotificationEntity {
    const { title, content } = this.generateContent(params);

    const notificationProps: Omit<NotificationProps, 'id'> = {
      type: params.type,
      title: params.customTitle || title,
      content: params.customContent || content,
      userId: params.userId,
      entityId: params.entityId,
      entityType: params.entityType,
    };

    return NotificationEntity.create(notificationProps);
  }

  /**
   * Creates a notification from persistence data
   */
  createFromPersistence(data: NotificationProps): NotificationEntity {
    return NotificationEntity.fromPersistence(data);
  }

  /**
   * Creates a like notification
   */
  createLikeNotification(
    userId: string,
    postId: string,
    actorName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.LIKE,
      userId,
      entityId: postId,
      entityType: NotificationEntityType.POST,
      actorName,
      entityName: 'post',
    });
  }

  /**
   * Creates a comment notification
   */
  createCommentNotification(
    userId: string,
    postId: string,
    actorName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.COMMENT,
      userId,
      entityId: postId,
      entityType: NotificationEntityType.POST,
      actorName,
      entityName: 'post',
    });
  }

  /**
   * Creates a follow notification
   */
  createFollowNotification(
    userId: string,
    followerId: string,
    actorName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.FOLLOW,
      userId,
      entityId: followerId,
      entityType: NotificationEntityType.USER,
      actorName,
    });
  }

  /**
   * Creates a message notification
   */
  createMessageNotification(
    userId: string,
    messageId: string,
    actorName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.MESSAGE,
      userId,
      entityId: messageId,
      entityType: NotificationEntityType.MESSAGE,
      actorName,
    });
  }

  /**
   * Creates a mention notification
   */
  createMentionNotification(
    userId: string,
    entityId: string,
    entityType: NotificationEntityType,
    actorName: string,
    isCommentMention: boolean = false,
  ): NotificationEntity {
    return this.createNotification({
      type: isCommentMention
        ? NotificationType.COMMENT_MENTION
        : NotificationType.POST_MENTION,
      userId,
      entityId,
      entityType,
      actorName,
      entityName:
        entityType === NotificationEntityType.POST ? 'post' : 'comment',
    });
  }

  /**
   * Creates a friend request notification
   */
  createFriendRequestNotification(
    userId: string,
    requesterId: string,
    actorName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.FRIEND_REQUEST,
      userId,
      entityId: requesterId,
      entityType: NotificationEntityType.USER,
      actorName,
    });
  }

  /**
   * Creates a birthday notification
   */
  createBirthdayNotification(
    userId: string,
    birthdayUserId: string,
    birthdayUserName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.BIRTHDAY,
      userId,
      entityId: birthdayUserId,
      entityType: NotificationEntityType.USER,
      actorName: birthdayUserName,
    });
  }

  /**
   * Creates a post share notification
   */
  createPostShareNotification(
    userId: string,
    postId: string,
    actorName: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.POST_SHARE,
      userId,
      entityId: postId,
      entityType: NotificationEntityType.POST,
      actorName,
      entityName: 'post',
    });
  }

  /**
   * Creates a system notification
   */
  createSystemNotification(
    userId: string,
    title: string,
    content: string,
  ): NotificationEntity {
    return this.createNotification({
      type: NotificationType.SYSTEM,
      userId,
      customTitle: title,
      customContent: content,
    });
  }

  /**
   * Generates notification content based on parameters
   * Pure factory method without external dependencies
   */
  private generateContent(params: CreateNotificationParams): {
    title: string;
    content: string;
  } {
    // Use custom content if provided
    if (params.customTitle && params.customContent) {
      return {
        title: params.customTitle,
        content: params.customContent,
      };
    }

    // Generate content based on notification type
    return this.generateDefaultContent(params);
  }

  /**
   * Generate default notification content based on type
   */
  private generateDefaultContent(params: CreateNotificationParams): {
    title: string;
    content: string;
  } {
    const actorName = params.actorName || 'Someone';
    const entityName = params.entityName || 'item';

    switch (params.type) {
      case NotificationType.LIKE:
        return {
          title: 'New Like',
          content: `${actorName} liked your ${entityName}`,
        };

      case NotificationType.COMMENT:
        return {
          title: 'New Comment',
          content: `${actorName} commented on your ${entityName}`,
        };

      case NotificationType.FOLLOW:
        return {
          title: 'New Follower',
          content: `${actorName} started following you`,
        };

      case NotificationType.MESSAGE:
        return {
          title: 'New Message',
          content: `${actorName} sent you a message`,
        };

      case NotificationType.POST_MENTION:
        return {
          title: 'Mentioned in Post',
          content: `${actorName} mentioned you in a post`,
        };

      case NotificationType.COMMENT_MENTION:
        return {
          title: 'Mentioned in Comment',
          content: `${actorName} mentioned you in a comment`,
        };

      case NotificationType.FRIEND_REQUEST:
        return {
          title: 'Friend Request',
          content: `${actorName} sent you a friend request`,
        };

      case NotificationType.POST_SHARE:
        return {
          title: 'Post Shared',
          content: `${actorName} shared your ${entityName}`,
        };

      case NotificationType.BIRTHDAY:
        return {
          title: 'Birthday Reminder',
          content: `It's ${actorName}'s birthday today!`,
        };

      case NotificationType.SYSTEM:
      default:
        return {
          title: 'System Notification',
          content: params.customContent || 'You have a new notification',
        };
    }
  }
}
