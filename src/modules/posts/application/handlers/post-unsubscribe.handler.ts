import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { UnsubscribePostDto } from '../dto/posts-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.POSTS.UNSUBSCRIBE_POST,
  priority: 1,
  middleware: ['auth'],
  description: 'Unsubscribe from post updates',
})
@Injectable()
export class PostUnsubscribeHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.POSTS.UNSUBSCRIBE_POST, 'posts');
  }

  protected async handleEvent(
    client: Socket,
    payload: UnsubscribePostDto,
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

    const postRoom = WEBSOCKET_ROOMS.POST(payload.postId);

    // Leave the post room
    await client.leave(postRoom);

    // Send success response
    await this.sendSuccessResponse(
      client,
      {
        postId: payload.postId,
        message: 'Successfully unsubscribed from post updates',
      },
      requestId,
    );

    this.logger.debug(
      `User ${user.id} unsubscribed from post ${payload.postId}`,
    );
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['postId']);
  }
}
