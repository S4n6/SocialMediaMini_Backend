import { Module } from '@nestjs/common';
import { MessagingInfrastructureModule } from '../infrastructure/messaging-infrastructure.module';
import { ConversationUseCases } from './use-cases/conversation.use-cases';
import { MessageUseCases } from './use-cases/message.use-cases';
import { MessagingApplicationServices } from './services';
import {
  ConversationDomainService,
  MessageDomainService,
  MessagingValidationService,
} from '../domain/services';

@Module({
  imports: [MessagingInfrastructureModule],
  providers: [
    // Domain Services
    ConversationDomainService,
    MessageDomainService,
    MessagingValidationService,

    // Use Cases
    ConversationUseCases,
    MessageUseCases,

    // Application Services
    MessagingApplicationServices,
  ],
  exports: [
    ConversationUseCases,
    MessageUseCases,
    MessagingApplicationServices,
  ],
})
export class MessagingApplicationModule {}
