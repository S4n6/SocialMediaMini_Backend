import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { AddCommentDto } from '../dto/posts-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.POSTS.ADD_COMMENT,
  priority: 1,
  middleware: ['auth'],
  description: 'Add comment to a post',
})
@Injectable()
export class PostAddCommentHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.POSTS.ADD_COMMENT, 'posts');
  }

  protected async handleEvent(
    client: Socket,
    payload: AddCommentDto,
    requestId?: string,
  ): Promise<void> {
    const user = this.getUserFromSocket(client);
    if (!user) {
      await this.sendErrorResponse(
        client,
        'UNAUTHORIZED',
        'User not authenticated',
        requestId,
      );
      return;
    }

    try {
      // TODO: Integrate with post domain service to add comment
      // For now, just simulate success and broadcast

      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Send success response to client
      await this.sendSuccessResponse(
        client,
        {
          commentId,
          postId: payload.postId,
          content: payload.content,
          parentId: payload.parentId,
          message: 'Comment added successfully',
        },
        requestId,
      );

      // Broadcast new comment to all post subscribers
      const commentData = {
        id: commentId,
        postId: payload.postId,
        content: payload.content,
        authorId: user.id,
        authorName: user.fullName || user.username || 'Unknown User',
        authorAvatar: user.profilePicture,
        parentId: payload.parentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.broadcastToRoom(
        client,
        `post:${payload.postId}`,
        WEBSOCKET_EVENTS.POSTS.NEW_COMMENT,
        commentData,
        true, // exclude self
      );

      this.logger.debug(
        `User ${user.id} added comment to post ${payload.postId}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to add comment',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    const hasRequired = this.validateRequiredFields(payload, [
      'postId',
      'content',
    ]);

    // Additional validation for content length
    if (hasRequired && payload.content) {
      const content = payload.content.trim();
      if (content.length === 0 || content.length > 1000) {
        this.logger.warn('Comment content length invalid');
        return false;
      }
    }

    return hasRequired;
  }
}
