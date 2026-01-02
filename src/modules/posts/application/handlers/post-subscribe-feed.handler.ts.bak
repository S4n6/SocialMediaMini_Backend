import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base-websocket.handler';
import { WebSocketHandler } from '../../../../shared/websocket/decorators/websocket.decorators';
import { SubscribeFeedDto } from '../dto/posts-websocket.dto';
import { WEBSOCKET_EVENTS } from '../../../../shared/websocket/constants/events.constants';
import { WEBSOCKET_ROOMS } from '../../../../shared/websocket/constants/rooms.constants';

@WebSocketHandler({
  eventName: WEBSOCKET_EVENTS.POSTS.SUBSCRIBE_FEED,
  priority: 1,
  middleware: ['auth'],
  description: 'Subscribe to feed updates',
})
@Injectable()
export class PostSubscribeFeedHandler extends BaseWebSocketHandler {
  constructor() {
    super(WEBSOCKET_EVENTS.POSTS.SUBSCRIBE_FEED, 'posts');
  }

  protected async handleEvent(
    client: Socket,
    payload: SubscribeFeedDto,
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
      const feedType = payload.feedType || 'timeline';
      let roomsToJoin: string[] = [];

      switch (feedType) {
        case 'timeline':
          // Subscribe to user's personalized timeline
          roomsToJoin = [
            WEBSOCKET_ROOMS.USER(user.id),
            WEBSOCKET_ROOMS.FOLLOWERS(user.id),
          ];
          break;

        case 'explore':
          // Subscribe to global explore feed
          roomsToJoin = [WEBSOCKET_ROOMS.GLOBAL_FEED];
          break;

        case 'following':
          // Subscribe to posts from followed users
          roomsToJoin = [WEBSOCKET_ROOMS.FOLLOWERS(user.id)];
          break;

        default:
          roomsToJoin = [WEBSOCKET_ROOMS.USER(user.id)];
      }

      // Join all relevant rooms
      for (const room of roomsToJoin) {
        await client.join(room);
      }

      // If hashtags are provided, join hashtag rooms
      if (payload.hashtags && payload.hashtags.length > 0) {
        for (const hashtag of payload.hashtags) {
          const hashtagRoom = `hashtag:${hashtag.toLowerCase().replace('#', '')}`;
          await client.join(hashtagRoom);
        }
      }

      // Send success response
      await this.sendSuccessResponse(
        client,
        {
          feedType,
          rooms: roomsToJoin,
          hashtags: payload.hashtags || [],
          message: `Successfully subscribed to ${feedType} feed`,
        },
        requestId,
      );

      this.logger.debug(
        `User ${user.id} subscribed to ${feedType} feed with ${roomsToJoin.length} rooms`,
      );
    } catch (error) {
      await this.sendErrorResponse(
        client,
        'HANDLER_ERROR',
        'Failed to subscribe to feed',
        requestId,
        { error: error.message },
      );
    }
  }

  public validatePayload(payload: any): boolean {
    // Feed subscription doesn't require specific fields
    // But validate feedType if provided
    if (
      payload.feedType &&
      !['timeline', 'explore', 'following'].includes(payload.feedType)
    ) {
      this.logger.warn(`Invalid feedType: ${payload.feedType}`);
      return false;
    }

    // Validate hashtags if provided
    if (payload.hashtags && Array.isArray(payload.hashtags)) {
      for (const hashtag of payload.hashtags) {
        if (typeof hashtag !== 'string' || hashtag.length === 0) {
          this.logger.warn('Invalid hashtag format');
          return false;
        }
      }
    }

    return true;
  }
}
