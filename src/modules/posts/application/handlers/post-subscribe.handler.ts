import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { SubscribePostDto } from '../dto/posts-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';
import { User } from '../../../users/domain/entities/user.entity';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.POSTS.SUBSCRIBE_POST,
  priority: 1,
  middleware: ['auth'],
  description: 'Subscribe to post updates',
})
@Injectable()
export class PostSubscribeHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.POSTS.SUBSCRIBE_POST, 'posts');
  }

  protected async handleEvent(
    client: Socket,
    payload: SubscribePostDto,
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

    // Join the post room
    await client.join(postRoom);

    // Send success response
    await this.sendSuccessResponse(
      client,
      {
        postId: payload.postId,
        message: 'Successfully subscribed to post updates',
      },
      requestId,
    );

    this.logger.debug(`User ${user.id} subscribed to post ${payload.postId}`);
  }

  public validatePayload(payload: any): boolean {
    return this.validateRequiredFields(payload, ['postId']);
  }
}
