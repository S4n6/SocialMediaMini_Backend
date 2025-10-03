import { Module } from '@nestjs/common';
import { MessagingApplicationModule } from '../application/messaging-application.module';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { MessagingGateway } from './gateways/messaging.gateway';

@Module({
  imports: [MessagingApplicationModule],
  controllers: [ConversationController, MessageController],
  providers: [MessagingGateway],
})
export class MessagingPresentationModule {}
