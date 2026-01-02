import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IMessageRepository,
  IConversationRepository,
  MessageDomainService,
  MessagingValidationService,
  MessageId,
  UserId,
} from '../../domain';

export interface AddReactionCommand {
  messageId: string;
  emoji: string;
  userId: string;
}

@Injectable()
export class AddReactionUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.MESSAGE_DOMAIN_SERVICE)
    private readonly messageDomainService: MessageDomainService,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async execute(command: AddReactionCommand): Promise<void> {
    const messageId = MessageId.fromString(command.messageId);
    const userId = UserId.fromString(command.userId);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Validate user has access to the conversation
    const conversation = await this.conversationRepository.findById(
      message.conversationId,
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      userId,
      'read',
    );

    const updatedMessage = this.messageDomainService.addReaction(
      message,
      command.emoji,
      userId,
    );

    await this.messageRepository.update(updatedMessage);
  }
}
