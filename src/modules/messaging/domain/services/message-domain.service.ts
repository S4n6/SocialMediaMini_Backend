import { Injectable } from '@nestjs/common';
import { Message } from '../entities/message.entity';
import {
  ConversationId,
  MessageId,
  UserId,
  MessageContent,
} from '../value-objects';
import { MessageType, MessageStatus } from '../enums';

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
