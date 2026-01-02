import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { ReactPostDto } from '../dto/posts-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.POSTS.REACT_POST,
  priority: 1,
  middleware: ['auth'],
  description: 'React to a post',
})
@Injectable()
export class PostReactHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.POSTS.REACT_POST, 'posts');
  }

  protected async handleEvent(
    client: Socket,
    payload: ReactPostDto,
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
      // TODO: Integrate with post domain service to add reaction
      // For now, just simulate success and broadcast

      // Send success response to client
      await this.sendSuccessResponse(
        client,
        {
          postId: payload.postId,
          reactionType: payload.reactionType,
          message: 'Reaction added successfully',
        },
        requestId,
      );

      // Broadcast reaction update to all post subscribers
      const eventData = {
        postId: payload.postId,
        userId: user.id,
        reactionType: payload.reactionType,
        action: 'add',
        timestamp: new Date().toISOString(),
      };

      await this.broadcastToRoom(
        client,
        `post:${payload.postId}`,
        WEBSOCKET_EVENTS.POSTS.POST_REACTION_UPDATE,
        eventData,
        true, // exclude self
      );

      this.logger.debug(
        `User ${user.id} reacted to post ${payload.postId} with ${payload.reactionType}`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to add reaction',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['postId', 'reactionType']);
  }
}
