import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { WebSocketHandlerRegistry } from '../../../../shared/websocket/application/services/websocket-handler.registry';
import {
  JoinConversationHandler,
  LeaveConversationHandler,
  SendMessageHandler,
  StartTypingHandler,
  StopTypingHandler,
  MarkMessageReadHandler,
  UpdateOnlineStatusHandler,
} from '../handlers';

@Injectable()
export class MessagingWebSocketRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(
    MessagingWebSocketRegistrationService.name,
  );

  constructor(private readonly handlerRegistry: WebSocketHandlerRegistry) {}

  async onModuleInit() {
    try {
      this.logger.log('Registering messaging WebSocket handlers...');

      // Create handler instances
      const joinConversationHandler = new JoinConversationHandler();
      const leaveConversationHandler = new LeaveConversationHandler();
      const sendMessageHandler = new SendMessageHandler();
      const startTypingHandler = new StartTypingHandler();
      const stopTypingHandler = new StopTypingHandler();
      const markMessageReadHandler = new MarkMessageReadHandler();
      const updateOnlineStatusHandler = new UpdateOnlineStatusHandler();

      // Register all messaging WebSocket handlers
      this.handlerRegistry.register(joinConversationHandler, {
        module: 'messaging',
        priority: 1,
      });
      this.handlerRegistry.register(leaveConversationHandler, {
        module: 'messaging',
        priority: 1,
      });
      this.handlerRegistry.register(sendMessageHandler, {
        module: 'messaging',
        priority: 1,
      });
      this.handlerRegistry.register(startTypingHandler, {
        module: 'messaging',
        priority: 1,
      });
      this.handlerRegistry.register(stopTypingHandler, {
        module: 'messaging',
        priority: 1,
      });
      this.handlerRegistry.register(markMessageReadHandler, {
        module: 'messaging',
        priority: 1,
      });
      this.handlerRegistry.register(updateOnlineStatusHandler, {
        module: 'messaging',
        priority: 1,
      });

      this.logger.log('Successfully registered 7 messaging WebSocket handlers');
    } catch (error) {
      this.logger.error(
        'Failed to register messaging WebSocket handlers:',
        error,
      );
      throw error;
    }
  }

  /**
   * Get registered handler information for debugging
   */
  getRegisteredHandlers() {
    return [
      'JoinConversationHandler',
      'LeaveConversationHandler',
      'SendMessageHandler',
      'StartTypingHandler',
      'StopTypingHandler',
      'MarkMessageReadHandler',
      'UpdateOnlineStatusHandler',
    ];
  }
}
