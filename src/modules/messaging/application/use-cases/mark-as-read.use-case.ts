import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IMessageRepository,
  IConversationRepository,
  MessageDomainService,
  MessagingValidationService,
  MessageId,
  ConversationId,
  UserId,
} from '../../domain';

export interface MarkMessageAsReadCommand {
  messageId: string;
  userId: string;
}

export interface MarkConversationAsReadCommand {
  conversationId: string;
  userId: string;
}

@Injectable()
export class MarkAsReadUseCase {
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

  async markMessageAsRead(command: MarkMessageAsReadCommand): Promise<void> {
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

    const readMessage = this.messageDomainService.markAsRead(
      message,
      new Date(),
    );
    await this.messageRepository.update(readMessage);
  }

  async markConversationAsRead(
    command: MarkConversationAsReadCommand,
  ): Promise<void> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const userId = UserId.fromString(command.userId);

    // Validate conversation exists and user has access
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      userId,
      'read',
    );

    // Get all unread messages in conversation
    const messages =
      await this.messageRepository.findByConversationId(conversationId);
    const unreadMessages = messages.filter(
      (message) =>
        !message.isRead && message.senderId && !message.senderId.equals(userId),
    );

    // Mark all as read
    const readAt = new Date();
    for (const message of unreadMessages) {
      const readMessage = this.messageDomainService.markAsRead(message, readAt);
      await this.messageRepository.update(readMessage);
    }
  }
}
