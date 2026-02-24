import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQPublisher } from './adapters/rabbitmq-publisher';
import { MESSAGE_PUBLISHER_TOKEN } from './message-queue.constants';

/**
 * Global Message Queue Module
 *
 * Provides a shared RabbitMQ publisher to all modules.
 * Only one connection is opened to the broker, avoiding
 * duplicate connections from per-module publishers.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MESSAGE_PUBLISHER_TOKEN,
      useClass: RabbitMQPublisher,
    },
  ],
  exports: [MESSAGE_PUBLISHER_TOKEN],
})
export class MessageQueueModule {}
