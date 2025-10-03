import { Injectable } from '@nestjs/common';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import {
  ConversationId,
  MessageId,
  UserId,
  ConversationParticipant,
  ConversationTitle,
  MessageContent,
} from './value-objects';
import {
  ConversationType,
  MessageType,
  MessageStatus,
  ConversationStatus,
  ParticipantRole,
} from './enums';

@Injectable()
export class ConversationDomainService {
  public createPrivateConversation(
    participantIds: [UserId, UserId],
    createdBy: UserId,
  ): Conversation {
    if (participantIds.length !== 2) {
      throw new Error('Private conversation must have exactly 2 participants');
    }

    if (participantIds[0].equals(participantIds[1])) {
      throw new Error('Cannot create conversation with the same user');
    }

    const conversationId = ConversationId.create();
    const participants = participantIds.map((userId) =>
      ConversationParticipant.create(userId, new Date()),
    );

    return Conversation.create({
      id: conversationId,
      type: ConversationType.PRIVATE,
      participants,
      createdBy,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      status: ConversationStatus.ACTIVE,
    });
  }

  public createGroupConversation(
    title: string,
    participantIds: UserId[],
    createdBy: UserId,
  ): Conversation {
    if (participantIds.length < 2) {
      throw new Error('Group conversation must have at least 2 participants');
    }

    if (participantIds.length > 100) {
      throw new Error(
        'Group conversation cannot have more than 100 participants',
      );
    }

    // Ensure creator is included in participants
    if (!participantIds.some((id) => id.equals(createdBy))) {
      participantIds.push(createdBy);
    }

    const conversationId = ConversationId.create();
    const participants = participantIds.map((userId) =>
      ConversationParticipant.create(
        userId,
        new Date(),
        userId.equals(createdBy)
          ? ParticipantRole.ADMIN
          : ParticipantRole.MEMBER,
      ),
    );

    return Conversation.create({
      id: conversationId,
      type: ConversationType.GROUP,
      title: ConversationTitle.create(title),
      participants,
      createdBy,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      status: ConversationStatus.ACTIVE,
    });
  }

  public addParticipant(
    conversation: Conversation,
    userId: UserId,
    addedBy: UserId,
  ): Conversation {
    if (conversation.type === ConversationType.PRIVATE) {
      throw new Error('Cannot add participants to private conversation');
    }

    if (!conversation.isParticipant(addedBy)) {
      throw new Error('Only participants can add new members');
    }

    if (conversation.isParticipant(userId)) {
      throw new Error('User is already a participant');
    }

    return conversation.addParticipant(userId, new Date());
  }

  public removeParticipant(
    conversation: Conversation,
    userId: UserId,
    removedBy: UserId,
  ): Conversation {
    if (conversation.type === ConversationType.PRIVATE) {
      throw new Error('Cannot remove participants from private conversation');
    }

    if (!conversation.isParticipant(removedBy) && !removedBy.equals(userId)) {
      throw new Error('Only participants can remove members');
    }

    if (!conversation.isParticipant(userId)) {
      throw new Error('User is not a participant');
    }

    return conversation.removeParticipant(userId, new Date());
  }

  public canUserAccessConversation(
    conversation: Conversation,
    userId: UserId,
  ): boolean {
    return conversation.isParticipant(userId);
  }

  public canUserSendMessage(
    conversation: Conversation,
    userId: UserId,
  ): boolean {
    return conversation.isParticipant(userId);
  }
}

@Injectable()
export class MessageDomainService {
  public createTextMessage(
    conversationId: ConversationId,
    senderId: UserId,
    content: string,
  ): Message {
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.TEXT,
      content: MessageContent.create(content),
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public createMediaMessage(
    conversationId: ConversationId,
    senderId: UserId,
    type: MessageType,
    attachmentUrl: string,
    content?: string,
  ): Message {
    if (
      ![
        MessageType.IMAGE,
        MessageType.VIDEO,
        MessageType.AUDIO,
        MessageType.DOCUMENT,
      ].includes(type)
    ) {
      throw new Error('Invalid media message type');
    }

    if (!attachmentUrl) {
      throw new Error('Attachment URL is required for media messages');
    }

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type,
      content: MessageContent.create(content || ''),
      attachments: attachmentUrl ? [{ url: attachmentUrl } as any] : undefined,
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public createSystemMessage(
    conversationId: ConversationId,
    content: string,
  ): Message {
    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId: null, // System messages don't have a sender
      type: MessageType.SYSTEM,
      content: MessageContent.create(content),
      status: MessageStatus.SENT,
      sentAt: new Date(),
    });
  }

  public createReplyMessage(
    conversationId: ConversationId,
    senderId: UserId,
    content: string,
    replyToMessageId: MessageId,
  ): Message {
    if (!content || content.trim().length === 0) {
      throw new Error('Reply content cannot be empty');
    }

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.TEXT,
      content: MessageContent.create(content),
      status: MessageStatus.PENDING,
      sentAt: new Date(),
      replyToMessageId,
    });
  }

  public markAsDelivered(message: Message, deliveredAt: Date): Message {
    if (message.status === MessageStatus.FAILED) {
      throw new Error('Cannot mark failed message as delivered');
    }

    return message.markAsDelivered(deliveredAt);
  }

  public markAsRead(message: Message, readAt: Date): Message {
    if (message.status === MessageStatus.FAILED) {
      throw new Error('Cannot mark failed message as read');
    }

    if (!message.deliveredAt) {
      throw new Error('Cannot mark message as read before it is delivered');
    }

    return message.markAsRead(readAt);
  }

  public editMessage(
    message: Message,
    newContent: string,
    editedAt: Date,
  ): Message {
    if (message.type === MessageType.SYSTEM) {
      throw new Error('Cannot edit system messages');
    }

    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Edited content cannot be empty');
    }

    if (message.sentAt && editedAt < message.sentAt) {
      throw new Error('Edit timestamp cannot be before send timestamp');
    }

    return message.edit(newContent, editedAt);
  }

  public addReaction(message: Message, emoji: string, userId: UserId): Message {
    if (!emoji || emoji.trim().length === 0) {
      throw new Error('Emoji cannot be empty');
    }

    return message.addReaction(emoji, userId);
  }

  public removeReaction(
    message: Message,
    emoji: string,
    userId: UserId,
  ): Message {
    return message.removeReaction(emoji, userId);
  }

  public canUserEditMessage(message: Message, userId: UserId): boolean {
    return message.senderId?.equals(userId) || false;
  }

  public canUserDeleteMessage(message: Message, userId: UserId): boolean {
    return message.senderId?.equals(userId) || false;
  }

  public isMessageExpired(
    message: Message,
    expirationHours: number = 24,
  ): boolean {
    if (!message.sentAt) {
      return false;
    }

    const expirationTime = new Date(
      message.sentAt.getTime() + expirationHours * 60 * 60 * 1000,
    );
    return new Date() > expirationTime;
  }
}

@Injectable()
export class MessagingValidationService {
  public validateConversationAccess(
    conversation: Conversation,
    userId: UserId,
    operation: 'read' | 'write' | 'admin',
  ): void {
    if (!conversation.isParticipant(userId)) {
      throw new Error('User does not have access to this conversation');
    }

    if (operation === 'admin') {
      const participant = conversation.getParticipant(userId);
      if (!participant || participant.role !== 'admin') {
        throw new Error('User does not have admin privileges');
      }
    }
  }

  public validateMessageOperation(
    message: Message,
    userId: UserId,
    operation: 'edit' | 'delete' | 'react',
  ): void {
    switch (operation) {
      case 'edit':
      case 'delete':
        if (!message.senderId?.equals(userId)) {
          throw new Error('Only message sender can perform this operation');
        }
        if (message.type === MessageType.SYSTEM) {
          throw new Error('Cannot modify system messages');
        }
        break;
      case 'react':
        // Anyone in the conversation can react
        break;
      default:
        throw new Error('Unknown operation');
    }
  }

  public validateMessageContent(content: string, type: MessageType): void {
    if (
      type === MessageType.TEXT &&
      (!content || content.trim().length === 0)
    ) {
      throw new Error('Text message content cannot be empty');
    }

    if (content && content.length > 10000) {
      throw new Error('Message content cannot exceed 10000 characters');
    }
  }

  public validateConversationParticipants(
    participants: UserId[],
    type: ConversationType,
  ): void {
    if (type === ConversationType.PRIVATE && participants.length !== 2) {
      throw new Error('Private conversation must have exactly 2 participants');
    }

    if (type === ConversationType.GROUP && participants.length < 2) {
      throw new Error('Group conversation must have at least 2 participants');
    }

    if (participants.length > 100) {
      throw new Error('Conversation cannot have more than 100 participants');
    }

    // Check for duplicate participants
    const uniqueParticipants = new Set(participants.map((p) => p.value));
    if (uniqueParticipants.size !== participants.length) {
      throw new Error('Duplicate participants are not allowed');
    }
  }
}
