import { Injectable } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';
import {
  ConversationId,
  UserId,
  ConversationParticipant,
  ConversationTitle,
} from '../value-objects';
import {
  ConversationType,
  ConversationStatus,
  ParticipantRole,
} from '../enums';

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
