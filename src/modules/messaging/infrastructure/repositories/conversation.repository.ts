import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IConversationRepository } from '../../domain/repositories';
import { Conversation } from '../../domain/conversation.entity';
import { ConversationId, UserId } from '../../domain/value-objects';
import { ConversationType } from '../../domain/enums';

@Injectable()
export class ConversationRepositoryImpl implements IConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversation: Conversation): Promise<void> {
    const data = conversation.toPrimitives();

    // Map domain model to current schema
    await this.prisma.conversation.create({
      data: {
        id: data.id,
        name: data.title,
        isGroup: data.type === ConversationType.GROUP,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        participants: {
          createMany: {
            data: data.participants.map((p) => ({
              userId: p.userId,
              role: p.role,
              joinedAt: new Date(p.joinedAt),
              lastReadAt: null, // Will be updated later
            })),
          },
        },
      },
    });
  }

  async findById(id: ConversationId): Promise<Conversation | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: id.value },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    // Map current schema to domain model
    const firstParticipant = conversation.participants[0];
    return Conversation.fromPrimitives({
      id: conversation.id,
      type: conversation.isGroup
        ? ConversationType.GROUP
        : ConversationType.PRIVATE,
      participants: conversation.participants.map((p) => ({
        userId: p.userId,
        joinedAt: p.joinedAt.toISOString(),
        role: p.role,
        leftAt: undefined, // Current schema doesn't support leftAt
      })),
      title: conversation.name || undefined,
      createdBy: firstParticipant?.userId || '', // Fallback
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      lastMessageAt: undefined, // Current schema doesn't support this
      isArchived: false, // Current schema doesn't support this
      settings: undefined, // Current schema doesn't support this
    });
  }

  async findByParticipants(participantIds: UserId[]): Promise<Conversation[]> {
    const userIdValues = participantIds.map((id) => id.value);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          every: {
            userId: { in: userIdValues },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.mapToConversations(conversations);
  }

  async findByParticipant(participantId: UserId): Promise<Conversation[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: participantId.value,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return this.mapToConversations(conversations);
  }

  async update(conversation: Conversation): Promise<void> {
    const data = conversation.toPrimitives();

    // Update conversation - only update fields supported by current schema
    await this.prisma.conversation.update({
      where: { id: data.id },
      data: {
        name: data.title,
        updatedAt: new Date(data.updatedAt),
      },
    });

    // Update participants - delete existing and recreate
    await this.prisma.userConversation.deleteMany({
      where: { conversationId: data.id },
    });

    await this.prisma.userConversation.createMany({
      data: data.participants.map((p) => ({
        conversationId: data.id,
        userId: p.userId,
        role: p.role,
        joinedAt: new Date(p.joinedAt),
        lastReadAt: null,
      })),
    });
  }

  async delete(id: ConversationId): Promise<void> {
    await this.prisma.conversation.delete({
      where: { id: id.value },
    });
  }

  async exists(id: ConversationId): Promise<boolean> {
    const count = await this.prisma.conversation.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  private mapToConversations(conversations: any[]): Conversation[] {
    return conversations.map((conversation) => {
      const firstParticipant = conversation.participants[0];
      return Conversation.fromPrimitives({
        id: conversation.id,
        type: conversation.isGroup
          ? ConversationType.GROUP
          : ConversationType.PRIVATE,
        participants: conversation.participants.map((p: any) => ({
          userId: p.userId,
          joinedAt: p.joinedAt.toISOString(),
          role: p.role,
          leftAt: undefined, // Current schema doesn't support leftAt
        })),
        title: conversation.name || undefined,
        createdBy: firstParticipant?.userId || '',
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        lastMessageAt: undefined, // Current schema doesn't support this
        isArchived: false, // Current schema doesn't support this
        settings: undefined, // Current schema doesn't support this
      });
    });
  }
}
