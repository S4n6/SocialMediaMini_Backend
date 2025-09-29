import { Injectable } from '@nestjs/common';
import {
  NotificationEntity,
  NotificationType,
  NotificationEntityType,
  NotificationProps,
} from '../notification.entity';
import { NotificationDomainService } from '../services/notification-domain.service';

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
 * Factory for creating notification entities
 */
@Injectable()
export class NotificationFactory {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
  ) {}

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
   */
  private generateContent(params: CreateNotificationParams): {
    title: string;
    content: string;
  } {
    return this.notificationDomainService.generateNotificationContent(
      params.type,
      {
        actorName: params.actorName,
        entityName: params.entityName,
        customMessage: params.customContent,
      },
    );
  }
}
