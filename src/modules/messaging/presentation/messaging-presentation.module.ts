import { Module } from '@nestjs/common';
import { MessagingApplicationModule } from '../application/messaging-application.module';
import { MessagingInfrastructureModule } from '../infrastructure/messaging-infrastructure.module';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';

@Module({
  imports: [
    MessagingApplicationModule,
    MessagingInfrastructureModule,
  ],
  controllers: [ConversationController, MessageController],
  providers: [],
  exports: [],
})
export class MessagingPresentationModule {}
