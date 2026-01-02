import { Module } from '@nestjs/common';
import { MessagingApplicationModule } from '../application/messaging-application.module';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';

@Module({
  imports: [MessagingApplicationModule],
  controllers: [ConversationController, MessageController],
  providers: [],
  exports: [],
})
export class MessagingPresentationModule {}
