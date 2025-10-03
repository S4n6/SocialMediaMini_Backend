import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import {
  WebSocketEvent,
  WebSocketNamespace,
} from '../interfaces/websocket.interface';
import { RoomManagerService } from '../core/room-manager.service';
import { ConnectionManagerService } from '../core/connection-manager.service';

export interface SocialEventData {
  userId: string;
  targetId: string; // postId, commentId, userId (for follows)
  type: 'post' | 'comment' | 'like' | 'follow';
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'liked'
    | 'unliked'
    | 'followed'
    | 'unfollowed';
  data?: any;
  timestamp: Date;
}

export interface PostEventData extends SocialEventData {
  postId: string;
  authorId: string;
  content?: string;
  mediaUrls?: string[];
}

export interface CommentEventData extends SocialEventData {
  postId: string;
  commentId: string;
  authorId: string;
  content?: string;
  parentCommentId?: string;
}

export interface FollowEventData extends SocialEventData {
  followerId: string;
  followingId: string;
  isAccepted?: boolean;
}

@Injectable()
export class SocialWebSocketService {
  private readonly logger = new Logger(SocialWebSocketService.name);
  private server: Server;

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
   * Handle join post event from client
   */
  handleJoinPost(client: Socket, data: { postId: string }) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) {
        client.emit('error', { message: 'Connection not found' });
        return;
      }

      const postRoom = this.roomManager.createPostRoom(
        data.postId,
        WebSocketNamespace.SOCIAL,
      );
      const joined = this.roomManager.joinRoom(
        postRoom.id,
        connection.userId,
        client.id,
      );

      if (joined) {
        void client.join(postRoom.id);
        client.emit('post_joined', {
          postId: data.postId,
          roomId: postRoom.id,
        });
      }
    } catch (error) {
      this.logger.error('Error joining post:', error);
      client.emit('error', { message: 'Failed to join post' });
    }
  }

  /**
   * Handle like post event from client
   */
  handleLikePost(client: Socket, data: { postId: string; liked: boolean }) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      const event = data.liked
        ? WebSocketEvent.POST_LIKED
        : WebSocketEvent.POST_UNLIKED;
      const postRoom = `post:${data.postId}`;

      const eventData = {
        postId: data.postId,
        userId: connection.userId,
        action: data.liked ? 'liked' : 'unliked',
        timestamp: new Date(),
      };

      // Notify users in post room
      this.server.to(postRoom).emit(event, eventData);

      client.emit('like_post_ack', eventData);
    } catch (error) {
      this.logger.error('Error handling post like:', error);
      client.emit('error', { message: 'Failed to like/unlike post' });
    }
  }

  /**
   * Handle add comment event from client
   */
  handleAddComment(
    client: Socket,
    data: {
      postId: string;
      content: string;
      parentCommentId?: string;
    },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      const commentData = {
        postId: data.postId,
        commentId: `comment_${Date.now()}_${Math.random()}`,
        authorId: connection.userId,
        content: data.content,
        parentCommentId: data.parentCommentId,
        timestamp: new Date(),
      };

      const postRoom = `post:${data.postId}`;
      this.server.to(postRoom).emit(WebSocketEvent.COMMENT_ADDED, commentData);

      client.emit('comment_added_ack', commentData);
    } catch (error) {
      this.logger.error('Error adding comment:', error);
      client.emit('error', { message: 'Failed to add comment' });
    }
  }

  /**
   * Handle follow user event from client
   */
  handleFollowUser(
    client: Socket,
    data: { targetUserId: string; follow: boolean },
  ) {
    try {
      const connection = this.connectionManager.getConnectionBySocket(
        client.id,
      );
      if (!connection) return;

      const event = data.follow
        ? WebSocketEvent.FOLLOW_REQUEST
        : 'unfollow_request';

      const followData = {
        followerId: connection.userId,
        followingId: data.targetUserId,
        action: data.follow ? 'followed' : 'unfollowed',
        timestamp: new Date(),
      };

      // Notify target user
      this.emitToUser(data.targetUserId, event as WebSocketEvent, followData);

      client.emit('follow_user_ack', followData);
    } catch (error) {
      this.logger.error('Error handling follow user:', error);
      client.emit('error', { message: 'Failed to follow/unfollow user' });
    }
  }

  // ============ BUSINESS LOGIC METHODS ============

  /**
   * Handle post creation/update/deletion
   */
  handlePostEvent(data: PostEventData): void {
    try {
      let event: WebSocketEvent;

      switch (data.action) {
        case 'created':
          event = WebSocketEvent.POST_CREATED;
          break;
        case 'updated':
          event = WebSocketEvent.POST_UPDATED;
          break;
        case 'deleted':
          event = WebSocketEvent.POST_DELETED;
          break;
        case 'liked':
          event = WebSocketEvent.POST_LIKED;
          break;
        case 'unliked':
          event = WebSocketEvent.POST_UNLIKED;
          break;
        default:
          this.logger.warn(`Unknown post action: ${data.action}`);
          return;
      }

      // Notify followers and interested users
      this.notifyFollowers(data.authorId, event, data);

      // Also notify users in the post's room (for comments/likes on posts they're engaged with)
      if (data.action === 'liked' || data.action === 'unliked') {
        const postRoom = this.getPostRoomId(data.postId);
        this.server.to(postRoom).emit(event, data);
      }

      this.logger.debug(
        `Post ${data.action} event handled for post ${data.postId}`,
      );
    } catch (error) {
      this.logger.error('Error handling post event:', error);
    }
  }

  /**
   * Handle comment events
   */
  handleCommentEvent(data: CommentEventData): void {
    try {
      let event: WebSocketEvent;

      switch (data.action) {
        case 'created':
          event = WebSocketEvent.COMMENT_ADDED;
          break;
        case 'liked':
          event = WebSocketEvent.COMMENT_LIKED;
          break;
        case 'unliked':
          event = WebSocketEvent.COMMENT_UNLIKED;
          break;
        default:
          this.logger.warn(`Unknown comment action: ${data.action}`);
          return;
      }

      // Notify post room (users interested in this post)
      const postRoom = this.getPostRoomId(data.postId);
      this.server.to(postRoom).emit(event, data);

      this.logger.debug(
        `Comment ${data.action} event handled for post ${data.postId}`,
      );
    } catch (error) {
      this.logger.error('Error handling comment event:', error);
    }
  }

  /**
   * Handle follow events
   */
  handleFollowEvent(data: FollowEventData): void {
    try {
      let event: WebSocketEvent;

      switch (data.action) {
        case 'followed':
          event = WebSocketEvent.FOLLOW_REQUEST;
          break;
        case 'unfollowed':
          // Could add FOLLOW_REMOVED event if needed
          return;
        default:
          if (data.isAccepted === true) {
            event = WebSocketEvent.FOLLOW_ACCEPTED;
          } else if (data.isAccepted === false) {
            event = WebSocketEvent.FOLLOW_DECLINED;
          } else {
            this.logger.warn(`Unknown follow action: ${data.action}`);
            return;
          }
      }

      // Notify the target user
      this.emitToUser(data.followingId, event, data);

      // If accepted, also notify the follower
      if (event === WebSocketEvent.FOLLOW_ACCEPTED) {
        this.emitToUser(data.followerId, event, data);
      }

      this.logger.debug(
        `Follow ${data.action} event handled between ${data.followerId} and ${data.followingId}`,
      );
    } catch (error) {
      this.logger.error('Error handling follow event:', error);
    }
  }

  /**
   * Join user to post room (for real-time updates on post they're viewing/commenting)
   */
  joinPostRoom(userId: string, socketId: string, postId: string): boolean {
    try {
      const room = this.roomManager.createPostRoom(
        postId,
        WebSocketNamespace.SOCIAL,
      );
      return this.roomManager.joinRoom(room.id, userId, socketId);
    } catch (error) {
      this.logger.error(`Error joining post room ${postId}:`, error);
      return false;
    }
  }

  /**
   * Leave post room
   */
  leavePostRoom(userId: string, socketId: string, postId: string): boolean {
    try {
      const roomId = this.getPostRoomId(postId);
      return this.roomManager.leaveRoom(roomId, userId, socketId);
    } catch (error) {
      this.logger.error(`Error leaving post room ${postId}:`, error);
      return false;
    }
  }

  /**
   * Join user to their feed room for real-time feed updates
   */
  joinFeedRoom(userId: string, socketId: string): boolean {
    try {
      const room = this.roomManager.createFeedRoom(
        userId,
        WebSocketNamespace.SOCIAL,
      );
      return this.roomManager.joinRoom(room.id, userId, socketId);
    } catch (error) {
      this.logger.error(`Error joining feed room for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Notify followers about user's activity
   */
  private notifyFollowers(
    userId: string,
    event: WebSocketEvent,
    data: unknown,
  ): void {
    try {
      // In a real app, you'd fetch the user's followers from database
      // For now, we'll use a feed-based approach
      const feedRoom = this.getFeedRoomId(userId);
      this.server.to(feedRoom).emit(event, data);
    } catch (error) {
      this.logger.error('Error notifying followers:', error);
    }
  }

  /**
   * Get post room ID
   */
  private getPostRoomId(postId: string): string {
    return `post:${postId}`;
  }

  /**
   * Get feed room ID
   */
  private getFeedRoomId(userId: string): string {
    return `feed:${userId}`;
  }
}
