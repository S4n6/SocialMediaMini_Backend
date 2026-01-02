import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { WebSocketHandlerRegistry } from '../../../../shared/websocket';
import {
  NotificationMarkReadHandler,
  NotificationMarkAllReadHandler,
  NotificationSubscribeHandler,
  NotificationUnsubscribeHandler,
  NotificationGetHistoryHandler,
} from '../handlers';

@Injectable()
export class NotificationWebSocketRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(
    NotificationWebSocketRegistrationService.name,
  );

  constructor(
    private readonly handlerRegistry: WebSocketHandlerRegistry,
    private readonly markReadHandler: NotificationMarkReadHandler,
    private readonly markAllReadHandler: NotificationMarkAllReadHandler,
    private readonly subscribeHandler: NotificationSubscribeHandler,
    private readonly unsubscribeHandler: NotificationUnsubscribeHandler,
    private readonly getHistoryHandler: NotificationGetHistoryHandler,
  ) {}

  async onModuleInit() {
    await this.registerHandlers();
  }

  private async registerHandlers(): Promise<void> {
    try {
      this.logger.log('Registering notification WebSocket handlers...');

      // Register all notification handlers with metadata
      const handlers = [
        {
          handler: this.markReadHandler,
          metadata: { module: 'notification', priority: 1 },
        },
        {
          handler: this.markAllReadHandler,
          metadata: { module: 'notification', priority: 1 },
        },
        {
          handler: this.subscribeHandler,
          metadata: { module: 'notification', priority: 2 },
        },
        {
          handler: this.unsubscribeHandler,
          metadata: { module: 'notification', priority: 2 },
        },
        {
          handler: this.getHistoryHandler,
          metadata: { module: 'notification', priority: 3 },
        },
      ];

      for (const { handler, metadata } of handlers) {
        this.handlerRegistry.register(handler, metadata);
        this.logger.log(`✅ Registered handler: ${handler.eventName}`);
      }

      this.logger.log(
        `🎉 Successfully registered ${handlers.length} notification WebSocket handlers`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register notification WebSocket handlers: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
