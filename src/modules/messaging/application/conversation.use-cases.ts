import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Conversation, ConversationType } from '../domain/conversation.entity';
import { ConversationRepository } from './repositories.interface';
import {
  ConversationId,
  UserId,
  ConversationParticipant,
  ConversationTitle,
} from '../domain/value-objects';
import { ParticipantRole, ConversationStatus } from '../domain/enums';

export interface CreateConversationRequest {
  participants: string[];
  type: ConversationType;
  metadata?: {
    title?: string;
    description?: string;
  };
  initiatorId: string;
}

export interface GetConversationsRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ConversationUseCases {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async createConversation(
    request: CreateConversationRequest,
  ): Promise<Conversation> {
    // Validate participants include the initiator
    if (!request.participants.includes(request.initiatorId)) {
      request.participants.push(request.initiatorId);
    }

    // For private conversations, ensure only 2 participants
    if (
      request.type === ConversationType.PRIVATE &&
      request.participants.length !== 2
    ) {
      throw new Error('Private conversations must have exactly 2 participants');
    }

    // Check if private conversation already exists
    if (request.type === ConversationType.PRIVATE) {
      const existingConversation =
        await this.conversationRepository.existsWithParticipants(
          request.participants,
        );

      if (existingConversation) {
        throw new Error(
          'Private conversation already exists between these users',
        );
      }
    }

    // Create conversation participants
    const participants = request.participants.map((participantId) =>
      ConversationParticipant.create(
        UserId.fromString(participantId),
        new Date(),
        participantId === request.initiatorId
          ? ParticipantRole.ADMIN
          : ParticipantRole.MEMBER,
      ),
    );

    const now = new Date();
    const conversationProps = {
      id: ConversationId.create(),
      participants,
      type: request.type,
      createdBy: UserId.fromString(request.initiatorId),
      createdAt: now,
      lastActivityAt: now,
      status: ConversationStatus.ACTIVE,
      ...(request.metadata?.title && {
        title: ConversationTitle.create(request.metadata.title),
      }),
    };

    // Create conversation
    const conversation = Conversation.create(conversationProps);

    await this.conversationRepository.create(conversation);
    return conversation;
  }

  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.isParticipant(UserId.fromString(userId))) {
      throw new ForbiddenException(
        'User is not a participant in this conversation',
      );
    }

    return conversation;
  }

  async getUserConversations(
    request: GetConversationsRequest,
  ): Promise<Conversation[]> {
    return this.conversationRepository.findByUserId(request.userId);
  }

  async addParticipantToConversation(
    conversationId: string,
    participantId: string,
    requesterId: string,
  ): Promise<void> {
    const conversation = await this.getConversationById(
      conversationId,
      requesterId,
    );

    if (conversation.isPrivateConversation()) {
      throw new Error('Cannot add participants to private conversations');
    }

    const updatedConversation = conversation.addParticipant(
      UserId.fromString(participantId),
      new Date(),
      ParticipantRole.MEMBER,
    );
    await this.conversationRepository.update(updatedConversation);
  }

  async removeParticipantFromConversation(
    conversationId: string,
    participantId: string,
    requesterId: string,
  ): Promise<void> {
    const conversation = await this.getConversationById(
      conversationId,
      requesterId,
    );

    if (conversation.isPrivateConversation()) {
      throw new Error('Cannot remove participants from private conversations');
    }

    // Users can only remove themselves or be removed by group admins (future feature)
    if (participantId !== requesterId) {
      throw new ForbiddenException(
        'Can only remove yourself from group conversations',
      );
    }

    const updatedConversation = conversation.removeParticipant(
      UserId.fromString(participantId),
      new Date(),
    );
    await this.conversationRepository.update(updatedConversation);
  }

  async updateConversationMetadata(
    conversationId: string,
    metadata: { title?: string; description?: string },
    requesterId: string,
  ): Promise<void> {
    const conversation = await this.getConversationById(
      conversationId,
      requesterId,
    );

    let updatedConversation = conversation;

    // Update title if provided
    if (metadata.title !== undefined) {
      updatedConversation = updatedConversation.updateTitle(
        ConversationTitle.create(metadata.title),
      );
    }

    // Note: description is not currently supported in ConversationSettings
    // If needed, it could be added to ConversationSettings interface

    await this.conversationRepository.update(updatedConversation);
  }

  async deleteConversation(
    conversationId: string,
    requesterId: string,
  ): Promise<void> {
    const conversation = await this.getConversationById(
      conversationId,
      requesterId,
    );

    // For now, any participant can delete the conversation
    // In future, might want to add admin checks for group conversations
    await this.conversationRepository.delete(conversationId);
  }
}
