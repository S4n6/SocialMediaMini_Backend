import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { WebSocketHandlerRegistry } from '../../../../shared/websocket/application/services/websocket-handler.registry';
import {
  PostSubscribeHandler,
  PostUnsubscribeHandler,
  PostReactHandler,
  PostUnreactHandler,
  PostAddCommentHandler,
  PostSubscribeFeedHandler,
} from '../handlers';

@Injectable()
export class PostWebSocketRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(PostWebSocketRegistrationService.name);

  constructor(private readonly handlerRegistry: WebSocketHandlerRegistry) {}

  async onModuleInit() {
    try {
      this.logger.log('Registering post WebSocket handlers...');

      // Create handler instances
      const subscribeHandler = new PostSubscribeHandler();
      const unsubscribeHandler = new PostUnsubscribeHandler();
      const reactHandler = new PostReactHandler();
      const unreactHandler = new PostUnreactHandler();
      const addCommentHandler = new PostAddCommentHandler();
      const subscribeFeedHandler = new PostSubscribeFeedHandler();

      // Register all post WebSocket handlers
      this.handlerRegistry.register(subscribeHandler, {
        module: 'posts',
        priority: 1,
      });
      this.handlerRegistry.register(unsubscribeHandler, {
        module: 'posts',
        priority: 1,
      });
      this.handlerRegistry.register(reactHandler, {
        module: 'posts',
        priority: 1,
      });
      this.handlerRegistry.register(unreactHandler, {
        module: 'posts',
        priority: 1,
      });
      this.handlerRegistry.register(addCommentHandler, {
        module: 'posts',
        priority: 1,
      });
      this.handlerRegistry.register(subscribeFeedHandler, {
        module: 'posts',
        priority: 1,
      });

      this.logger.log('Successfully registered 6 post WebSocket handlers');
    } catch (error) {
      this.logger.error('Failed to register post WebSocket handlers:', error);
      throw error;
    }
  }

  /**
   * Get registered handler information for debugging
   */
  getRegisteredHandlers() {
    return [
      'PostSubscribeHandler',
      'PostUnsubscribeHandler',
      'PostReactHandler',
      'PostUnreactHandler',
      'PostAddCommentHandler',
      'PostSubscribeFeedHandler',
    ];
  }
}
