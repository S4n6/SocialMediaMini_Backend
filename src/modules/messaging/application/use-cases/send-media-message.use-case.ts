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
  MessageType,
} from '../../domain';

export interface SendMediaMessageCommand {
  conversationId: string;
  senderId: string;
  type: MessageType;
  attachmentUrl: string;
  content?: string;
}

export interface SendMediaMessageResult {
  messageId: string;
}

@Injectable()
export class SendMediaMessageUseCase {
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
    command: SendMediaMessageCommand,
  ): Promise<SendMediaMessageResult> {
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

    const message = this.messageDomainService.createMediaMessage(
      conversationId,
      senderId,
      command.type,
      command.attachmentUrl,
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
