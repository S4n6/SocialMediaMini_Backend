import { Injectable, Inject } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
} from '../../infrastructure/messaging-infrastructure.module';
import {
  IConversationRepository,
  IMessageRepository,
} from '../../domain/repositories';
import {
  Message,
  MessageDomainService,
  MessagingValidationService,
  ConversationId,
  MessageId,
  UserId,
} from '../../domain';
import { MessageType } from '../../domain/enums';

export interface SendTextMessageCommand {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface SendMediaMessageCommand {
  conversationId: string;
  senderId: string;
  type: MessageType;
  attachmentUrl: string;
  content?: string;
}

export interface SendReplyMessageCommand {
  conversationId: string;
  senderId: string;
  content: string;
  replyToMessageId: string;
}

export interface EditMessageCommand {
  messageId: string;
  newContent: string;
  editedBy: string;
}

export interface DeleteMessageCommand {
  messageId: string;
  deletedBy: string;
}

export interface AddReactionCommand {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface RemoveReactionCommand {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface GetConversationMessagesQuery {
  conversationId: string;
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface MarkMessageAsReadCommand {
  messageId: string;
  userId: string;
}

export interface MarkConversationAsReadCommand {
  conversationId: string;
  userId: string;
}

@Injectable()
export class MessageUseCases {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    private readonly messageDomainService: MessageDomainService,
    private readonly validationService: MessagingValidationService,
  ) {}

  async sendTextMessage(command: SendTextMessageCommand): Promise<string> {
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
      MessageType.TEXT,
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

    return message.id.value;
  }

  async sendMediaMessage(command: SendMediaMessageCommand): Promise<string> {
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

    return message.id.value;
  }

  async sendReplyMessage(command: SendReplyMessageCommand): Promise<string> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const senderId = UserId.fromString(command.senderId);
    const replyToMessageId = MessageId.fromString(command.replyToMessageId);

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
      MessageType.TEXT,
    );

    // Validate the message being replied to exists and belongs to this conversation
    const replyToMessage =
      await this.messageRepository.findById(replyToMessageId);
    if (
      !replyToMessage ||
      !replyToMessage.conversationId.equals(conversationId)
    ) {
      throw new Error('Reply target message not found in this conversation');
    }

    const message = this.messageDomainService.createReplyMessage(
      conversationId,
      senderId,
      command.content,
      replyToMessageId,
    );

    await this.messageRepository.save(message);

    // Update conversation's last message timestamp
    const updatedConversation = conversation.updateLastMessageAt(
      message.sentAt,
    );
    await this.conversationRepository.update(updatedConversation);

    return message.id.value;
  }

  async editMessage(command: EditMessageCommand): Promise<void> {
    const messageId = MessageId.fromString(command.messageId);
    const editedBy = UserId.fromString(command.editedBy);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    this.validationService.validateMessageOperation(message, editedBy, 'edit');
    this.validationService.validateMessageContent(
      command.newContent,
      message.type,
    );

    if (!message.isEditableWithinTimeLimit(24)) {
      throw new Error(
        'Message can no longer be edited (24-hour limit exceeded)',
      );
    }

    const editedMessage = this.messageDomainService.editMessage(
      message,
      command.newContent,
      new Date(),
    );

    await this.messageRepository.update(editedMessage);
  }

  async deleteMessage(command: DeleteMessageCommand): Promise<void> {
    const messageId = MessageId.fromString(command.messageId);
    const deletedBy = UserId.fromString(command.deletedBy);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    this.validationService.validateMessageOperation(
      message,
      deletedBy,
      'delete',
    );

    await this.messageRepository.delete(messageId);
  }

  async addReaction(command: AddReactionCommand): Promise<void> {
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

  async removeReaction(command: RemoveReactionCommand): Promise<void> {
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

    const updatedMessage = this.messageDomainService.removeReaction(
      message,
      command.emoji,
      userId,
    );

    await this.messageRepository.update(updatedMessage);
  }

  async getConversationMessages(query: GetConversationMessagesQuery): Promise<{
    messages: Message[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    const conversationId = ConversationId.fromString(query.conversationId);
    const userId = UserId.fromString(query.userId);

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

    const cursor = query.cursor
      ? MessageId.fromString(query.cursor)
      : undefined;
    const result = await this.messageRepository.findByConversationIdPaginated(
      conversationId,
      cursor,
      query.limit || 50,
    );

    return {
      messages: result.messages,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor?.value,
    };
  }

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

  async getUnreadMessageCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const convId = ConversationId.fromString(conversationId);
    const reqUserId = UserId.fromString(userId);

    return await this.messageRepository.countUnreadMessages(convId, reqUserId);
  }
}
