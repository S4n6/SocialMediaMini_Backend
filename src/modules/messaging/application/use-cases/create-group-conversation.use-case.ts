import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IConversationRepository,
  ConversationDomainService,
  UserId,
} from '../../domain';

export interface CreateGroupConversationCommand {
  title: string;
  participantIds: string[];
  createdBy: string;
  description?: string;
  avatarUrl?: string;
}

export interface CreateGroupConversationResult {
  conversationId: string;
}

@Injectable()
export class CreateGroupConversationUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.CONVERSATION_DOMAIN_SERVICE)
    private readonly conversationDomainService: ConversationDomainService,
  ) {}

  async execute(
    command: CreateGroupConversationCommand,
  ): Promise<CreateGroupConversationResult> {
    const participantIds = command.participantIds.map((id) =>
      UserId.fromString(id),
    );
    const createdBy = UserId.fromString(command.createdBy);

    const conversation = this.conversationDomainService.createGroupConversation(
      command.title,
      participantIds,
      createdBy,
    );

    await this.conversationRepository.save(conversation);

    return { conversationId: conversation.id.value };
  }
}
