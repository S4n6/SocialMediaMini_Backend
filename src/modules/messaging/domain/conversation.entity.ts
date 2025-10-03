import {
  ConversationId,
  UserId,
  ConversationTitle,
  ConversationParticipant,
} from './value-objects';
import { ConversationType, ConversationStatus, ParticipantRole } from './enums';
import { Entity } from '../../../shared/domain';

export { ConversationType };

export interface ConversationProps {
  id: ConversationId;
  type: ConversationType;
  participants: ConversationParticipant[];
  title?: ConversationTitle;
  description?: string;
  avatarUrl?: string;
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  lastActivityAt: Date;
  status: ConversationStatus;
  settings?: ConversationSettings;
  unreadCount?: number;
}

export interface ConversationSettings {
  isEncrypted?: boolean;
  allowNotifications?: boolean;
  muteUntil?: Date;
  autoDeleteMessages?: boolean;
  autoDeleteDuration?: number; // in hours
  maxParticipants?: number;
  allowInviteLinks?: boolean;
  adminOnlyMessaging?: boolean;
}

export class Conversation extends Entity<ConversationId> {
  private constructor(private readonly props: ConversationProps) {
    super(props.id);
  }

  public static create(
    props: Omit<ConversationProps, 'updatedAt'>,
  ): Conversation {
    return new Conversation({
      ...props,
      updatedAt: props.createdAt,
    });
  }

  public static fromPrimitives(data: {
    id: string;
    type: string;
    participants: Array<{
      userId: string;
      joinedAt: string;
      role?: string;
      leftAt?: string;
    }>;
    title?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string;
    isArchived?: boolean;
    settings?: ConversationSettings;
  }): Conversation {
    return new Conversation({
      id: ConversationId.fromString(data.id),
      type: data.type as ConversationType,
      participants: data.participants.map((p) =>
        ConversationParticipant.create(
          UserId.fromString(p.userId),
          new Date(p.joinedAt),
          (p.role as ParticipantRole) || ParticipantRole.MEMBER,
          p.leftAt ? new Date(p.leftAt) : undefined,
        ),
      ),
      title: data.title ? ConversationTitle.create(data.title) : undefined,
      createdBy: UserId.fromString(data.createdBy),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastMessageAt: data.lastMessageAt
        ? new Date(data.lastMessageAt)
        : undefined,
      lastActivityAt: new Date(),
      status: ConversationStatus.ACTIVE,
      settings: data.settings,
    });
  }

  // Getters
  public get id(): ConversationId {
    return this.props.id;
  }

  public get type(): ConversationType {
    return this.props.type;
  }

  public get participants(): ConversationParticipant[] {
    return [...this.props.participants];
  }

  public get activeParticipants(): ConversationParticipant[] {
    return this.props.participants.filter((p) => p.isActive);
  }

  public get title(): ConversationTitle | undefined {
    return this.props.title;
  }

  public get createdBy(): UserId {
    return this.props.createdBy;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get lastMessageAt(): Date | undefined {
    return this.props.lastMessageAt;
  }

  public get lastActivityAt(): Date {
    return this.props.lastActivityAt;
  }

  public get status(): ConversationStatus {
    return this.props.status;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  public get unreadCount(): number {
    return this.props.unreadCount || 0;
  }

  public isActive(): boolean {
    return this.props.status === ConversationStatus.ACTIVE;
  }

  public isArchived(): boolean {
    return this.props.status === ConversationStatus.ARCHIVED;
  }

  public isDeleted(): boolean {
    return this.props.status === ConversationStatus.DELETED;
  }

  public isMuted(): boolean {
    return this.props.status === ConversationStatus.MUTED;
  }

  public get settings(): ConversationSettings | undefined {
    return this.props.settings;
  }

  // Business Logic Methods
  public isParticipant(userId: UserId): boolean {
    return this.activeParticipants.some((p) => p.userId.equals(userId));
  }

  public getParticipant(userId: UserId): ConversationParticipant | undefined {
    return this.props.participants.find((p) => p.userId.equals(userId));
  }

  public addParticipant(
    userId: UserId,
    joinedAt: Date,
    role: string = 'member',
  ): Conversation {
    if (this.isParticipant(userId)) {
      throw new Error('User is already a participant');
    }

    const newParticipant = ConversationParticipant.create(
      userId,
      joinedAt,
      role as ParticipantRole,
    );
    const updatedParticipants = [...this.props.participants, newParticipant];

    return new Conversation({
      ...this.props,
      participants: updatedParticipants,
      updatedAt: new Date(),
    });
  }

  public removeParticipant(userId: UserId, leftAt: Date): Conversation {
    const participantIndex = this.props.participants.findIndex((p) =>
      p.userId.equals(userId),
    );

    if (participantIndex === -1) {
      throw new Error('User is not a participant');
    }

    const participant = this.props.participants[participantIndex];
    const updatedParticipant = participant.leave(leftAt);

    const updatedParticipants = [...this.props.participants];
    updatedParticipants[participantIndex] = updatedParticipant;

    return new Conversation({
      ...this.props,
      participants: updatedParticipants,
      updatedAt: new Date(),
    });
  }

  public updateTitle(title: ConversationTitle): Conversation {
    if (this.type === ConversationType.PRIVATE) {
      throw new Error('Cannot set title for private conversations');
    }

    return new Conversation({
      ...this.props,
      title,
      updatedAt: new Date(),
    });
  }

  public updateSettings(settings: Partial<ConversationSettings>): Conversation {
    return new Conversation({
      ...this.props,
      settings: {
        ...this.props.settings,
        ...settings,
      },
      updatedAt: new Date(),
    });
  }

  public archive(): Conversation {
    return new Conversation({
      ...this.props,
      status: ConversationStatus.ARCHIVED,
      updatedAt: new Date(),
    });
  }

  public unarchive(): Conversation {
    return new Conversation({
      ...this.props,
      status: ConversationStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  public updateLastMessageAt(lastMessageAt: Date): Conversation {
    return new Conversation({
      ...this.props,
      lastMessageAt,
      updatedAt: new Date(),
    });
  }

  public isPrivateConversation(): boolean {
    return this.props.type === ConversationType.PRIVATE;
  }

  public updateMetadata(metadata: Partial<ConversationSettings>): Conversation {
    return this.updateSettings(metadata);
  }

  public canUserPerformAction(
    userId: UserId,
    action: 'read' | 'write' | 'admin',
  ): boolean {
    const participant = this.getParticipant(userId);

    if (!participant || !participant.isActive) {
      return false;
    }

    switch (action) {
      case 'read':
      case 'write':
        return true;
      case 'admin':
        return participant.role === 'admin' || this.createdBy.equals(userId);
      default:
        return false;
    }
  }

  // Serialization
  public toPrimitives(): {
    id: string;
    type: string;
    participants: Array<{
      userId: string;
      joinedAt: string;
      role: string;
      leftAt?: string;
    }>;
    title?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string;
    isArchived: boolean;
    settings?: ConversationSettings;
  } {
    return {
      id: this.props.id.value,
      type: this.props.type,
      participants: this.props.participants.map((p) => ({
        userId: p.userId.value,
        joinedAt: p.joinedAt.toISOString(),
        role: p.role,
        leftAt: p.leftAt?.toISOString(),
      })),
      title: this.props.title?.value,
      createdBy: this.props.createdBy.value,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      lastMessageAt: this.props.lastMessageAt?.toISOString(),
      isArchived: this.props.status === ConversationStatus.ARCHIVED,
      settings: this.props.settings,
    };
  }
}
