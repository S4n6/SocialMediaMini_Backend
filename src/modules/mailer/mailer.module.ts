// src/modules/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { RabbitMQPublisher } from './infrastructure/rabbitmq-publisher';
import { MESSAGE_PUBLISHER_TOKEN } from './mailer.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MESSAGE_PUBLISHER_TOKEN,
      useClass: RabbitMQPublisher,
    },
    MailerService,
  ],
  exports: [MailerService],
})
export class MailerModule {}
