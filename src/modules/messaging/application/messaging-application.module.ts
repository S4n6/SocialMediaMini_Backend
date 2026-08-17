import { Module } from '@nestjs/common';
import { MessagingInfrastructureModule } from '../infrastructure/messaging-infrastructure.module';
import { MESSAGING_TOKENS } from '../constants';

// Domain Services
import {
  ConversationDomainService,
  MessageDomainService,
  MessagingValidationService,
} from '../domain/services';

// Use Cases
import {
  SendTextMessageUseCase,
  SendMediaMessageUseCase,
  EditMessageUseCase,
  DeleteMessageUseCase,
  AddReactionUseCase,
  GetConversationMessagesUseCase,
  MarkAsReadUseCase,
  CreatePrivateConversationUseCase,
  CreateGroupConversationUseCase,
  GetUserConversationsUseCase,
  ManageParticipantsUseCase,
} from './use-cases';

// Application Services
import {
  ConversationApplicationService,
  MessageApplicationService,
  ConversationEnrichmentService,
  MessageEnrichmentService,
  MessagingApplicationServices, // Legacy
} from './services';

// Use Case Aggregators
import { MessageUseCases } from './use-cases/message.use-cases';
import { ConversationUseCases } from './use-cases/conversation.use-cases';

@Module({
  imports: [MessagingInfrastructureModule],
  providers: [
    // Domain Services with tokens
    {
      provide: MESSAGING_TOKENS.CONVERSATION_DOMAIN_SERVICE,
      useClass: ConversationDomainService,
    },
    {
      provide: MESSAGING_TOKENS.MESSAGE_DOMAIN_SERVICE,
      useClass: MessageDomainService,
    },
    {
      provide: MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE,
      useClass: MessagingValidationService,
    },

    // Message Use Cases
    SendTextMessageUseCase,
    SendMediaMessageUseCase,
    EditMessageUseCase,
    DeleteMessageUseCase,
    AddReactionUseCase,
    GetConversationMessagesUseCase,
    MarkAsReadUseCase,

    // Conversation Use Cases
    CreatePrivateConversationUseCase,
    CreateGroupConversationUseCase,
    GetUserConversationsUseCase,
    ManageParticipantsUseCase,

    // Application Services
    ConversationApplicationService,
    MessageApplicationService,
    ConversationEnrichmentService,
    MessageEnrichmentService,

    // Legacy - will be removed
    MessagingApplicationServices,

    // Add the use case aggregators for backwards compatibility
    MessageUseCases,
    ConversationUseCases,
    {
      provide: 'MESSAGE_USE_CASES',
      useClass: MessageUseCases,
    },
    {
      provide: 'CONVERSATION_USE_CASES',
      useClass: ConversationUseCases,
    },
  ],
  exports: [
    // Use Cases
    SendTextMessageUseCase,
    SendMediaMessageUseCase,
    EditMessageUseCase,
    DeleteMessageUseCase,
    AddReactionUseCase,
    GetConversationMessagesUseCase,
    MarkAsReadUseCase,
    CreatePrivateConversationUseCase,
    CreateGroupConversationUseCase,
    GetUserConversationsUseCase,
    ManageParticipantsUseCase,

    // Application Services
    ConversationApplicationService,
    MessageApplicationService,
    ConversationEnrichmentService,
    MessageEnrichmentService,

    // Legacy
    MessagingApplicationServices,

    // Use case aggregators
    MessageUseCases,
    ConversationUseCases,
    'MESSAGE_USE_CASES',
    'CONVERSATION_USE_CASES',
  ],
})
export class MessagingApplicationModule {}
