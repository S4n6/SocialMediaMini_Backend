import { Module } from '@nestjs/common';
import { MessagingApplicationModule } from '../application/messaging-application.module';
import { MessagingInfrastructureModule } from '../infrastructure/messaging-infrastructure.module';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { MessagingGateway } from './gateways/messaging.gateway';

@Module({
  imports: [
    MessagingApplicationModule,
    MessagingInfrastructureModule, // For CONVERSATION_REPOSITORY token used by gateway
  ],
  controllers: [ConversationController, MessageController],
  providers: [MessagingGateway],
  exports: [],
})
export class MessagingPresentationModule {}
