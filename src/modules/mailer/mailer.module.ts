// src/modules/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';

/**
 * Mailer Module
 *
 * Uses the shared MESSAGE_PUBLISHER_TOKEN provided globally by MessageQueueModule.
 * No longer manages its own RabbitMQ connection.
 */
@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
