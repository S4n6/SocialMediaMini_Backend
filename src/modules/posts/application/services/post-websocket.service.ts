import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { MainWebSocketGateway } from '../../../../shared/websocket/websocket.gateway';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';
import {
  PostDto,
  PostCommentDto,
  PostReactionUpdateDto,
  PostAnalyticsDto,
} from '../dto/posts-websocket.dto';

@Injectable()
export class PostWebSocketService {
  private readonly logger = new Logger(PostWebSocketService.name);

  constructor(
    @Inject(forwardRef(() => MainWebSocketGateway))
    private readonly gateway: MainWebSocketGateway,
  ) {}

  /**
   * Broadcast new post to relevant feeds
   */
  async broadcastNewPost(
    post: PostDto,
    audienceUserIds?: string[],
  ): Promise<void> {
    try {
      // Broadcast to global feed for public posts
      if (post.privacy === 'PUBLIC') {
        this.gateway.server
          .to(WEBSOCKET_ROOMS.GLOBAL_FEED)
          .emit(WEBSOCKET_EVENTS.POSTS.NEW_POST, post);
      }

      // Broadcast to author's followers
      const followersRoom = WEBSOCKET_ROOMS.FOLLOWERS(post.authorId);
      this.gateway.server
        .to(followersRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.NEW_POST, post);

      // Broadcast to specific users if provided
      if (audienceUserIds && audienceUserIds.length > 0) {
        for (const userId of audienceUserIds) {
          const userRoom = WEBSOCKET_ROOMS.USER(userId);
          this.gateway.server
            .to(userRoom)
            .emit(WEBSOCKET_EVENTS.POSTS.NEW_POST, post);
        }
      }

      // Broadcast to hashtag rooms if post has hashtags
      if (post.hashtags && post.hashtags.length > 0) {
        for (const hashtag of post.hashtags) {
          const hashtagRoom = `hashtag:${hashtag.toLowerCase().replace('#', '')}`;
          this.gateway.server
            .to(hashtagRoom)
            .emit(WEBSOCKET_EVENTS.POSTS.NEW_POST, post);
        }
      }

      this.logger.debug(`Broadcasted new post ${post.id} to relevant feeds`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast new post: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast post update to subscribers
   */
  async broadcastPostUpdate(post: PostDto): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(post.id);

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.POST_UPDATED, post);

      this.logger.debug(`Broadcasted post update for ${post.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast post update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast post deletion to subscribers
   */
  async broadcastPostDeleted(postId: string, authorId: string): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(postId);

      const deleteData = {
        postId,
        authorId,
        timestamp: new Date().toISOString(),
      };

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.POST_DELETED, deleteData);

      this.logger.debug(`Broadcasted post deletion for ${postId}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast post deletion: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast reaction update to post subscribers
   */
  async broadcastReactionUpdate(
    reactionUpdate: PostReactionUpdateDto,
  ): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(reactionUpdate.postId);

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.POST_REACTION_UPDATE, reactionUpdate);

      this.logger.debug(
        `Broadcasted reaction update for post ${reactionUpdate.postId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast reaction update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast new comment to post subscribers
   */
  async broadcastNewComment(comment: PostCommentDto): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(comment.id);

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.NEW_COMMENT, comment);

      // Also notify the post author if comment author is different
      // This will be integrated with notification system later

      this.logger.debug(`Broadcasted new comment for post ${comment.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast new comment: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast comment update to post subscribers
   */
  async broadcastCommentUpdate(comment: PostCommentDto): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(comment.id);

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.COMMENT_UPDATED, comment);

      this.logger.debug(`Broadcasted comment update for post ${comment.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast comment update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast comment deletion to post subscribers
   */
  async broadcastCommentDeleted(
    commentId: string,
    postId: string,
  ): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(postId);

      const deleteData = {
        commentId,
        postId,
        timestamp: new Date().toISOString(),
      };

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.COMMENT_DELETED, deleteData);

      this.logger.debug(
        `Broadcasted comment deletion for comment ${commentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast comment deletion: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast feed update to user
   */
  async broadcastFeedUpdate(userId: string, feedData: any): Promise<void> {
    try {
      const userRoom = WEBSOCKET_ROOMS.USER(userId);

      this.gateway.server
        .to(userRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.FEED_UPDATE, feedData);

      this.logger.debug(`Broadcasted feed update to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast feed update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast post analytics update
   */
  async broadcastAnalyticsUpdate(analytics: PostAnalyticsDto): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(analytics.postId);

      this.gateway.server
        .to(postRoom)
        .emit(WEBSOCKET_EVENTS.POSTS.POST_ANALYTICS, analytics);

      this.logger.debug(
        `Broadcasted analytics update for post ${analytics.postId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast analytics update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get connected users count for a post
   */
  async getPostSubscribersCount(postId: string): Promise<number> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(postId);
      const roomSockets = await this.gateway.server.in(postRoom).fetchSockets();
      return roomSockets.length;
    } catch (error) {
      this.logger.error(
        `Failed to get post subscribers count: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Get connected users in a room
   */
  async getRoomConnections(roomName: string): Promise<string[]> {
    try {
      const roomSockets = await this.gateway.server.in(roomName).fetchSockets();
      return roomSockets.map((socket) => socket.id);
    } catch (error) {
      this.logger.error(
        `Failed to get room connections: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Emit event to specific user
   */
  async emitToUser(userId: string, event: string, data: any): Promise<void> {
    try {
      const userRoom = WEBSOCKET_ROOMS.USER(userId);
      this.gateway.server.to(userRoom).emit(event, data);

      this.logger.debug(`Emitted ${event} to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to emit to user: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Emit event to specific post room
   */
  async emitToPost(postId: string, event: string, data: any): Promise<void> {
    try {
      const postRoom = WEBSOCKET_ROOMS.POST(postId);
      this.gateway.server.to(postRoom).emit(event, data);

      this.logger.debug(`Emitted ${event} to post ${postId}`);
    } catch (error) {
      this.logger.error(
        `Failed to emit to post: ${error.message}`,
        error.stack,
      );
    }
  }
}
