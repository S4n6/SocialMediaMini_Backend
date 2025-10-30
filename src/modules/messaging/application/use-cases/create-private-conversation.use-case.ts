import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IConversationRepository,
  ConversationDomainService,
  ConversationId,
  UserId,
} from '../../domain';

export interface CreatePrivateConversationCommand {
  participantIds: [string, string];
  createdBy: string;
}

export interface CreatePrivateConversationResult {
  conversationId: string;
}

@Injectable()
export class CreatePrivateConversationUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.CONVERSATION_DOMAIN_SERVICE)
    private readonly conversationDomainService: ConversationDomainService,
  ) {}

  async execute(
    command: CreatePrivateConversationCommand,
  ): Promise<CreatePrivateConversationResult> {
    const participantIds: [UserId, UserId] = [
      UserId.fromString(command.participantIds[0]),
      UserId.fromString(command.participantIds[1]),
    ];
    const createdBy = UserId.fromString(command.createdBy);

    // Check if conversation already exists between these users
    const existingConversations =
      await this.conversationRepository.findByParticipants(participantIds);

    const existingPrivateConversation = existingConversations.find(
      (conv) => conv.type === 'private',
    );

    if (existingPrivateConversation) {
      return { conversationId: existingPrivateConversation.id.value };
    }

    const conversation =
      this.conversationDomainService.createPrivateConversation(
        participantIds,
        createdBy,
      );

    await this.conversationRepository.save(conversation);

    return { conversationId: conversation.id.value };
  }
}
