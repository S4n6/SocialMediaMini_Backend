import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IConversationRepository,
  IMessageRepository,
  MessageDomainService,
  MessagingValidationService,
  ConversationId,
  MessageId,
  UserId,
} from '../../domain';

export interface SendTextMessageCommand {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface SendTextMessageResult {
  messageId: string;
}

@Injectable()
export class SendTextMessageUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGING_TOKENS.MESSAGE_DOMAIN_SERVICE)
    private readonly messageDomainService: MessageDomainService,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async execute(
    command: SendTextMessageCommand,
  ): Promise<SendTextMessageResult> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const senderId = UserId.fromString(command.senderId);

    // Validate conversation exists and user has access
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      senderId,
      'write',
    );
    this.validationService.validateMessageContent(
      command.content,
      'text' as any,
    );

    const message = this.messageDomainService.createTextMessage(
      conversationId,
      senderId,
      command.content,
    );

    await this.messageRepository.save(message);

    // Update conversation's last message timestamp
    const updatedConversation = conversation.updateLastMessageAt(
      message.sentAt,
    );
    await this.conversationRepository.update(updatedConversation);

    return { messageId: message.id.value };
  }
}
