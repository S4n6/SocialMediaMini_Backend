import { Message } from '../entities/message.entity';
import {
  ConversationId,
  MessageId,
  UserId,
  MessageContent,
  MessageAttachment,
  MessageLocation,
} from '../value-objects';
import { MessageType, MessageStatus } from '../enums';

export class MessageFactory {
  public static createTextMessage(
    conversationId: ConversationId,
    senderId: UserId,
    content: string,
  ): Message {
    this.validateTextMessageContent(content);

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

  public static createImageMessage(
    conversationId: ConversationId,
    senderId: UserId,
    attachmentUrl: string,
    caption?: string,
  ): Message {
    this.validateMediaMessage(attachmentUrl, MessageType.IMAGE);

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.IMAGE,
      content: MessageContent.create(caption || ''),
      attachments: [MessageAttachment.create(MessageType.IMAGE, attachmentUrl)],
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public static createVideoMessage(
    conversationId: ConversationId,
    senderId: UserId,
    attachmentUrl: string,
    caption?: string,
  ): Message {
    this.validateMediaMessage(attachmentUrl, MessageType.VIDEO);

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.VIDEO,
      content: MessageContent.create(caption || ''),
      attachments: [MessageAttachment.create(MessageType.VIDEO, attachmentUrl)],
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public static createAudioMessage(
    conversationId: ConversationId,
    senderId: UserId,
    attachmentUrl: string,
    duration?: number,
  ): Message {
    this.validateMediaMessage(attachmentUrl, MessageType.AUDIO);

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.AUDIO,
      content: MessageContent.create(''),
      attachments: [
        MessageAttachment.create(
          MessageType.AUDIO,
          attachmentUrl,
          undefined,
          undefined,
          undefined,
          undefined,
          duration,
        ),
      ],
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public static createDocumentMessage(
    conversationId: ConversationId,
    senderId: UserId,
    attachmentUrl: string,
    fileName: string,
    fileSize?: number,
  ): Message {
    this.validateMediaMessage(attachmentUrl, MessageType.DOCUMENT);
    this.validateFileName(fileName);

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.DOCUMENT,
      content: MessageContent.create(fileName),
      attachments: [
        MessageAttachment.create(
          MessageType.DOCUMENT,
          attachmentUrl,
          fileName,
          fileSize,
        ),
      ],
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public static createLocationMessage(
    conversationId: ConversationId,
    senderId: UserId,
    latitude: number,
    longitude: number,
    address?: string,
  ): Message {
    this.validateLocationData(latitude, longitude);

    return Message.create({
      id: MessageId.create(),
      conversationId,
      senderId,
      type: MessageType.LOCATION,
      content: MessageContent.create(address || 'Location'),
      location: MessageLocation.create(latitude, longitude, address),
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });
  }

  public static createSystemMessage(
    conversationId: ConversationId,
    content: string,
  ): Message {
    this.validateSystemMessageContent(content);

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

  public static createReplyMessage(
    conversationId: ConversationId,
    senderId: UserId,
    content: string,
    replyToMessageId: MessageId,
  ): Message {
    this.validateTextMessageContent(content);

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

  private static validateTextMessageContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Text message content cannot be empty');
    }

    if (content.length > 4000) {
      throw new Error('Message content cannot exceed 4000 characters');
    }
  }

  private static validateMediaMessage(
    attachmentUrl: string,
    type: MessageType,
  ): void {
    if (!attachmentUrl || attachmentUrl.trim().length === 0) {
      throw new Error(`${type} message must have an attachment URL`);
    }

    // Basic URL validation
    try {
      new URL(attachmentUrl);
    } catch {
      throw new Error('Invalid attachment URL format');
    }
  }

  private static validateLocationData(
    latitude: number,
    longitude: number,
  ): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  private static validateSystemMessageContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('System message content cannot be empty');
    }

    if (content.length > 500) {
      throw new Error('System message content cannot exceed 500 characters');
    }
  }

  private static validateFileName(fileName: string): void {
    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name cannot be empty');
    }

    if (fileName.length > 255) {
      throw new Error('File name cannot exceed 255 characters');
    }

    // Check for invalid characters in file name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      throw new Error('File name contains invalid characters');
    }
  }
}
