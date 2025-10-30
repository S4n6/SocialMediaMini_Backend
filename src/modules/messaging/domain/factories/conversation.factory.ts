import { Conversation } from '../entities/conversation.entity';
import {
  ConversationId,
  UserId,
  ConversationTitle,
  ConversationParticipant,
} from '../value-objects';
import {
  ConversationType,
  ConversationStatus,
  ParticipantRole,
} from '../enums';
import { ConversationSettings } from '../entities/conversation.entity';

export class ConversationFactory {
  public static createPrivateConversation(
    participantIds: [UserId, UserId],
    createdBy: UserId,
  ): Conversation {
    this.validatePrivateConversationParticipants(participantIds);

    const conversationId = ConversationId.create();
    const participants = participantIds.map((userId) =>
      ConversationParticipant.create(
        userId,
        new Date(),
        ParticipantRole.MEMBER,
      ),
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

  public static createGroupConversation(
    title: string,
    participantIds: UserId[],
    createdBy: UserId,
    description?: string,
    avatarUrl?: string,
    settings?: ConversationSettings,
  ): Conversation {
    this.validateGroupConversationData(title, participantIds);

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
      description,
      avatarUrl,
      participants,
      createdBy,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      status: ConversationStatus.ACTIVE,
      settings: settings || ConversationFactory.getDefaultGroupSettings(),
    });
  }

  public static createChannelConversation(
    title: string,
    participantIds: UserId[],
    createdBy: UserId,
    description?: string,
    avatarUrl?: string,
    settings?: ConversationSettings,
  ): Conversation {
    this.validateGroupConversationData(title, participantIds);

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
      type: ConversationType.GROUP, // Use GROUP type for now, can be extended later
      title: ConversationTitle.create(title),
      description,
      avatarUrl,
      participants,
      createdBy,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      status: ConversationStatus.ACTIVE,
      settings: settings || ConversationFactory.getDefaultChannelSettings(),
    });
  }

  private static validatePrivateConversationParticipants(
    participantIds: [UserId, UserId],
  ): void {
    if (participantIds.length !== 2) {
      throw new Error('Private conversation must have exactly 2 participants');
    }

    if (participantIds[0].equals(participantIds[1])) {
      throw new Error('Cannot create conversation with the same user');
    }
  }

  private static validateGroupConversationData(
    title: string,
    participantIds: UserId[],
  ): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Group conversation must have a title');
    }

    if (title.length > 255) {
      throw new Error('Conversation title cannot exceed 255 characters');
    }

    if (participantIds.length < 2) {
      throw new Error('Group conversation must have at least 2 participants');
    }

    if (participantIds.length > 100) {
      throw new Error(
        'Group conversation cannot have more than 100 participants',
      );
    }

    // Check for duplicate participants
    const uniqueParticipants = new Set(participantIds.map((p) => p.value));
    if (uniqueParticipants.size !== participantIds.length) {
      throw new Error('Duplicate participants are not allowed');
    }
  }

  private static getDefaultGroupSettings(): ConversationSettings {
    return {
      isEncrypted: false,
      allowNotifications: true,
      autoDeleteMessages: false,
      maxParticipants: 100,
      allowInviteLinks: true,
      adminOnlyMessaging: false,
    };
  }

  private static getDefaultChannelSettings(): ConversationSettings {
    return {
      isEncrypted: false,
      allowNotifications: true,
      autoDeleteMessages: false,
      maxParticipants: 1000,
      allowInviteLinks: true,
      adminOnlyMessaging: true, // Channels default to admin-only messaging
    };
  }
}
