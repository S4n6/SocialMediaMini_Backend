import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IMessageRepository } from '../../domain/repositories';
import { Message } from '../../domain/message.entity';
import { ConversationId, MessageId, UserId } from '../../domain/value-objects';
import { MessageType, MessageStatus } from '../../domain/enums';

@Injectable()
export class MessageRepositoryImpl implements IMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(message: Message): Promise<void> {
    const data = message.toPrimitives();

    // Skip system messages (senderId is null) as current schema requires senderId
    if (!data.senderId) {
      throw new Error('Current schema does not support system messages');
    }

    await this.prisma.message.create({
      data: {
        id: data.id,
        content: data.content,
        messageType: data.type,
        senderId: data.senderId,
        conversationId: data.conversationId,
        createdAt: new Date(data.sentAt),
      },
    });
  }

  async findById(id: MessageId): Promise<Message | null> {
    const message = await this.prisma.message.findUnique({
      where: { id: id.value },
      include: {
        sender: true,
        conversation: true,
      },
    });

    if (!message) {
      return null;
    }

    return this.mapToMessage(message);
  }

  async findByConversationId(
    conversationId: ConversationId,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversationId.value,
      },
      include: {
        sender: true,
        conversation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return messages.map(this.mapToMessage);
  }

  async findByConversationIdPaginated(
    conversationId: ConversationId,
    cursor?: MessageId,
    limit: number = 50,
  ): Promise<{
    messages: Message[];
    hasMore: boolean;
    nextCursor?: MessageId;
  }> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversationId.value,
        ...(cursor && {
          id: {
            lt: cursor.value,
          },
        }),
      },
      include: {
        sender: true,
        conversation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // Take one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor =
      hasMore && resultMessages.length > 0
        ? MessageId.fromString(resultMessages[resultMessages.length - 1].id)
        : undefined;

    return {
      messages: resultMessages.map(this.mapToMessage),
      hasMore,
      nextCursor,
    };
  }

  async update(message: Message): Promise<void> {
    const data = message.toPrimitives();

    await this.prisma.message.update({
      where: { id: data.id },
      data: {
        content: data.content,
        messageType: data.type,
        isRead: data.status === MessageStatus.READ,
      },
    });
  }

  async delete(id: MessageId): Promise<void> {
    await this.prisma.message.delete({
      where: { id: id.value },
    });
  }

  async markAsDelivered(
    messageId: MessageId,
    deliveredAt: Date,
  ): Promise<void> {
    // Current schema doesn't support delivered status, so we just update the read status
    await this.prisma.message.update({
      where: { id: messageId.value },
      data: {
        // Current schema only has isRead, so we can't mark as delivered separately
      },
    });
  }

  async markAsRead(messageId: MessageId, readAt: Date): Promise<void> {
    await this.prisma.message.update({
      where: { id: messageId.value },
      data: {
        isRead: true,
      },
    });
  }

  async countUnreadMessages(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<number> {
    return await this.prisma.message.count({
      where: {
        conversationId: conversationId.value,
        senderId: {
          not: userId.value,
        },
        isRead: false,
      },
    });
  }

  async getLastMessage(
    conversationId: ConversationId,
  ): Promise<Message | null> {
    const message = await this.prisma.message.findFirst({
      where: {
        conversationId: conversationId.value,
      },
      include: {
        sender: true,
        conversation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!message) {
      return null;
    }

    return this.mapToMessage(message);
  }

  async exists(id: MessageId): Promise<boolean> {
    const count = await this.prisma.message.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  private mapToMessage(message: any): Message {
    return Message.fromPrimitives({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.messageType as MessageType,
      status: message.isRead ? MessageStatus.READ : MessageStatus.SENT,
      sentAt: message.createdAt.toISOString(),
      deliveredAt: undefined, // Current schema doesn't support this
      readAt: message.isRead ? message.createdAt.toISOString() : undefined,
      editedAt: undefined, // Current schema doesn't support this
      attachmentUrl: undefined, // Current schema doesn't support this
      replyToMessageId: undefined, // Current schema doesn't support this
      reactions: [], // Current schema doesn't support this
    });
  }
}
