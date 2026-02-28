import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import {
  NotificationType,
  NotificationEntityType,
} from '../../domain/enums/notification.enums';
import { SocialPayload } from '../../domain/value-objects/notification-payload.vo';

// ────────────────────────────────────────────────────────────
// Event shapes emitted by other modules via EventEmitter2
// ────────────────────────────────────────────────────────────

export interface PostLikedEvent {
  postId: string;
  postOwnerId: string;
  actorId: string;
  actorName: string;
}

export interface PostCommentedEvent {
  postId: string;
  commentId: string;
  postOwnerId: string;
  actorId: string;
  actorName: string;
  commentPreview: string;
}

export interface UserFollowedEvent {
  followerId: string;
  followerName: string;
  followeeId: string;
}

export interface MentionEvent {
  mentionedUserId: string;
  actorId: string;
  actorName: string;
  entityId: string;
  entityType: 'post' | 'comment';
  preview: string;
}

/**
 * Subscriber that listens to social interaction events emitted by
 * other NestJS modules (posts, comments, follow, etc.) via EventEmitter2
 * and creates the corresponding notification.
 *
 * This is the **glue** that decouples FriendshipService / PostService
 * from the NotificationModule.
 */
@Injectable()
export class SocialEventSubscriber {
  private readonly logger = new Logger(SocialEventSubscriber.name);

  constructor(private readonly createNotification: CreateNotificationUseCase) {}

  // ── post.liked ──────────────────────────────────────────

  @OnEvent('post.liked')
  async handlePostLiked(event: PostLikedEvent): Promise<void> {
    // Don't notify yourself
    if (event.actorId === event.postOwnerId) return;

    const metadata: SocialPayload = {
      kind: 'social',
      actorId: event.actorId,
      actorName: event.actorName,
      targetId: event.postId,
    };

    await this.safeCreate({
      type: NotificationType.LIKE,
      title: 'New Like',
      content: `${event.actorName} liked your post`,
      userId: event.postOwnerId,
      entityId: event.postId,
      entityType: NotificationEntityType.POST,
      metadata,
    });
  }

  // ── post.commented ──────────────────────────────────────

  @OnEvent('post.commented')
  async handlePostCommented(event: PostCommentedEvent): Promise<void> {
    if (event.actorId === event.postOwnerId) return;

    const metadata: SocialPayload = {
      kind: 'social',
      actorId: event.actorId,
      actorName: event.actorName,
      targetId: event.commentId,
    };

    await this.safeCreate({
      type: NotificationType.COMMENT,
      title: 'New Comment',
      content: `${event.actorName} commented: "${event.commentPreview}"`,
      userId: event.postOwnerId,
      entityId: event.postId,
      entityType: NotificationEntityType.POST,
      metadata,
    });
  }

  // ── user.followed ───────────────────────────────────────

  @OnEvent('user.followed')
  async handleUserFollowed(event: UserFollowedEvent): Promise<void> {
    const metadata: SocialPayload = {
      kind: 'social',
      actorId: event.followerId,
      actorName: event.followerName,
    };

    await this.safeCreate({
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      content: `${event.followerName} started following you`,
      userId: event.followeeId,
      entityId: event.followerId,
      entityType: NotificationEntityType.USER,
      metadata,
    });
  }

  // ── user.mentioned ──────────────────────────────────────

  @OnEvent('user.mentioned')
  async handleMention(event: MentionEvent): Promise<void> {
    if (event.actorId === event.mentionedUserId) return;

    const entityType =
      event.entityType === 'post'
        ? NotificationEntityType.POST
        : NotificationEntityType.COMMENT;

    const metadata: SocialPayload = {
      kind: 'social',
      actorId: event.actorId,
      actorName: event.actorName,
      targetId: event.entityId,
    };

    await this.safeCreate({
      type: NotificationType.MENTION,
      title: 'You were mentioned',
      content: `${event.actorName} mentioned you: "${event.preview}"`,
      userId: event.mentionedUserId,
      entityId: event.entityId,
      entityType,
      metadata,
    });
  }

  // ── Defensive wrapper ───────────────────────────────────

  private async safeCreate(
    dto: Parameters<CreateNotificationUseCase['execute']>[0],
  ): Promise<void> {
    try {
      await this.createNotification.execute(dto);
    } catch (error) {
      // Log but never re-throw — subscribers must not crash the emitter
      this.logger.error(
        `Failed to create notification [${dto.type}] for user ${dto.userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
