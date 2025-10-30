import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IConversationRepository,
  ConversationDomainService,
  MessagingValidationService,
  ConversationId,
  UserId,
} from '../../domain';

export interface AddParticipantCommand {
  conversationId: string;
  userId: string;
  addedBy: string;
}

export interface RemoveParticipantCommand {
  conversationId: string;
  userId: string;
  removedBy: string;
}

@Injectable()
export class ManageParticipantsUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.CONVERSATION_DOMAIN_SERVICE)
    private readonly conversationDomainService: ConversationDomainService,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async addParticipant(command: AddParticipantCommand): Promise<void> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const userId = UserId.fromString(command.userId);
    const addedBy = UserId.fromString(command.addedBy);

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      addedBy,
      'admin',
    );

    const updatedConversation = this.conversationDomainService.addParticipant(
      conversation,
      userId,
      addedBy,
    );

    await this.conversationRepository.update(updatedConversation);
  }

  async removeParticipant(command: RemoveParticipantCommand): Promise<void> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const userId = UserId.fromString(command.userId);
    const removedBy = UserId.fromString(command.removedBy);

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Users can remove themselves, or admins can remove others
    if (!userId.equals(removedBy)) {
      this.validationService.validateConversationAccess(
        conversation,
        removedBy,
        'admin',
      );
    }

    const updatedConversation =
      this.conversationDomainService.removeParticipant(
        conversation,
        userId,
        removedBy,
      );

    await this.conversationRepository.update(updatedConversation);
  }
}
