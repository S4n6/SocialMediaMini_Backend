import {
  ConversationId,
  MessageId,
  UserId,
  MessageContent,
  MessageAttachment,
  MessageMetadata,
  MessageLocation,
} from './value-objects';
import { MessageType, MessageStatus } from './enums';
import { Entity } from '../../../shared/domain';

export { MessageType, MessageContent };

export interface MessageProps {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId | null; // null for system messages
  content: MessageContent;
  type: MessageType;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  attachments?: MessageAttachment[];
  location?: MessageLocation;
  replyToMessageId?: MessageId;
  metadata?: MessageMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export class Message extends Entity<MessageId> {
  private constructor(private readonly props: MessageProps) {
    super(props.id);
  }

  public static create(
    props: Omit<
      MessageProps,
      | 'deliveredAt'
      | 'readAt'
      | 'editedAt'
      | 'deletedAt'
      | 'metadata'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): Message {
    const now = new Date();

    // Validate content for text messages
    if (props.type === MessageType.TEXT && !props.content) {
      throw new Error('Text messages must have content');
    }

    // Validate attachment for media messages
    const mediaTypes = [
      MessageType.IMAGE,
      MessageType.VIDEO,
      MessageType.AUDIO,
      MessageType.DOCUMENT,
      MessageType.GIF,
      MessageType.STICKER,
    ];
    if (
      mediaTypes.includes(props.type) &&
      (!props.attachments || props.attachments.length === 0)
    ) {
      throw new Error('Media messages must have at least one attachment');
    }

    // Validate location for location messages
    if (props.type === MessageType.LOCATION && !props.location) {
      throw new Error('Location messages must have location data');
    }

    // System messages can have null sender
    if (props.type !== MessageType.SYSTEM && !props.senderId) {
      throw new Error('Non-system messages must have a sender');
    }

    const messageProps: MessageProps = {
      ...props,
      metadata: MessageMetadata.create(),
      createdAt: now,
      updatedAt: now,
    };

    return new Message(messageProps);
  }

  public static fromPrimitives(data: {
    id: string;
    conversationId: string;
    senderId: string | null;
    content: string;
    type: string;
    status: string;
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
    editedAt?: string;
    attachmentUrl?: string;
    replyToMessageId?: string;
    reactions?: Array<{ emoji: string; userIds: string[] }>;
  }): Message {
    // Convert reactions to Map
    const reactionsMap = new Map<string, UserId[]>();
    if (data.reactions) {
      data.reactions.forEach((r) => {
        reactionsMap.set(
          r.emoji,
          r.userIds.map((id) => UserId.fromString(id)),
        );
      });
    }

    const metadata = MessageMetadata.create(
      data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      data.readAt ? new Date(data.readAt) : undefined,
      data.editedAt ? new Date(data.editedAt) : undefined,
      data.replyToMessageId
        ? MessageId.fromString(data.replyToMessageId)
        : undefined,
      reactionsMap,
    );

    return new Message({
      id: MessageId.fromString(data.id),
      conversationId: ConversationId.fromString(data.conversationId),
      senderId: data.senderId ? UserId.fromString(data.senderId) : null,
      content: MessageContent.create(data.content),
      type: data.type as MessageType,
      status: data.status as MessageStatus,
      sentAt: new Date(data.sentAt),
      deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
      readAt: data.readAt ? new Date(data.readAt) : undefined,
      editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
      attachments: data.attachmentUrl
        ? [{ url: data.attachmentUrl } as MessageAttachment]
        : undefined,
      replyToMessageId: data.replyToMessageId
        ? MessageId.fromString(data.replyToMessageId)
        : undefined,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Getters
  public get id(): MessageId {
    return this.props.id;
  }

  public get conversationId(): ConversationId {
    return this.props.conversationId;
  }

  public get senderId(): UserId | null {
    return this.props.senderId;
  }

  public get content(): MessageContent {
    return this.props.content;
  }

  public get type(): MessageType {
    return this.props.type;
  }

  public get status(): MessageStatus {
    return this.props.status;
  }

  public get sentAt(): Date {
    return this.props.sentAt;
  }

  public get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  public get readAt(): Date | undefined {
    return this.props.readAt;
  }

  public get editedAt(): Date | undefined {
    return this.props.editedAt;
  }

  public get attachmentUrl(): string | undefined {
    return this.props.attachments?.[0]?.url;
  }

  public get replyToMessageId(): MessageId | undefined {
    return this.props.replyToMessageId;
  }

  public get metadata(): MessageMetadata | undefined {
    return this.props.metadata;
  }

  public get isSystemMessage(): boolean {
    return (
      this.props.type === MessageType.SYSTEM || this.props.senderId === null
    );
  }

  public get isDelivered(): boolean {
    return !!this.props.deliveredAt;
  }

  public get isRead(): boolean {
    return !!this.props.readAt;
  }

  public get isEdited(): boolean {
    return !!this.props.editedAt;
  }

  public get hasAttachment(): boolean {
    return !!this.props.attachments && this.props.attachments.length > 0;
  }

  public get isReply(): boolean {
    return !!this.props.replyToMessageId;
  }

  // Business Logic Methods
  public markAsDelivered(deliveredAt: Date): Message {
    if (this.props.status === MessageStatus.FAILED) {
      throw new Error('Cannot mark failed message as delivered');
    }

    if (this.props.deliveredAt) {
      return this; // Already delivered
    }

    return new Message({
      ...this.props,
      status: MessageStatus.DELIVERED,
      deliveredAt,
      metadata: this.props.metadata?.markAsDelivered(deliveredAt),
    });
  }

  public markAsRead(readAt: Date): Message {
    if (this.props.status === MessageStatus.FAILED) {
      throw new Error('Cannot mark failed message as read');
    }

    if (!this.props.deliveredAt) {
      throw new Error('Cannot mark message as read before it is delivered');
    }

    if (this.props.readAt) {
      return this; // Already read
    }

    return new Message({
      ...this.props,
      status: MessageStatus.READ,
      readAt,
      metadata: this.props.metadata?.markAsRead(readAt),
    });
  }

  public markAsFailed(): Message {
    return new Message({
      ...this.props,
      status: MessageStatus.FAILED,
    });
  }

  public edit(newContent: string, editedAt: Date): Message {
    if (this.props.type === MessageType.SYSTEM) {
      throw new Error('Cannot edit system messages');
    }

    if (this.props.sentAt && editedAt < this.props.sentAt) {
      throw new Error('Edit timestamp cannot be before send timestamp');
    }

    return new Message({
      ...this.props,
      content: MessageContent.create(newContent),
      editedAt,
      metadata: this.props.metadata?.markAsEdited(editedAt),
    });
  }

  public addReaction(emoji: string, userId: UserId): Message {
    if (!emoji || emoji.trim().length === 0) {
      throw new Error('Emoji cannot be empty');
    }

    const updatedMetadata =
      this.props.metadata?.addReaction(emoji, userId) ||
      MessageMetadata.create().addReaction(emoji, userId);

    return new Message({
      ...this.props,
      metadata: updatedMetadata,
    });
  }

  public removeReaction(emoji: string, userId: UserId): Message {
    if (!this.props.metadata) {
      return this; // No reactions to remove
    }

    const updatedMetadata = this.props.metadata.removeReaction(emoji, userId);

    return new Message({
      ...this.props,
      metadata: updatedMetadata,
    });
  }

  public getReactions(): Map<string, UserId[]> {
    return this.props.metadata?.reactions || new Map();
  }

  public getUserReactions(userId: UserId): string[] {
    const reactions = this.getReactions();
    const userReactions: string[] = [];

    reactions.forEach((userIds, emoji) => {
      if (userIds.some((id) => id.equals(userId))) {
        userReactions.push(emoji);
      }
    });

    return userReactions;
  }

  public getReactionCount(emoji: string): number {
    const reactions = this.getReactions();
    return reactions.get(emoji)?.length || 0;
  }

  public canBeEditedBy(userId: UserId): boolean {
    if (this.props.type === MessageType.SYSTEM) {
      return false;
    }

    return this.props.senderId?.equals(userId) || false;
  }

  public canBeDeletedBy(userId: UserId): boolean {
    return this.canBeEditedBy(userId);
  }

  public isEditableWithinTimeLimit(timeLimitHours: number = 24): boolean {
    if (!this.props.sentAt) {
      return false;
    }

    const timeLimitMs = timeLimitHours * 60 * 60 * 1000;
    const now = new Date();
    return now.getTime() - this.props.sentAt.getTime() <= timeLimitMs;
  }

  public get createdAt(): Date {
    return this.props.sentAt;
  }

  public get updatedAt(): Date {
    return this.props.editedAt || this.props.sentAt;
  }

  public isDeleted(): boolean {
    return (
      this.props.status === MessageStatus.FAILED &&
      this.props.content.value === '[deleted]'
    );
  }

  public editContent(newContent: MessageContent): Message {
    if (!this.canBeEditedBy(this.props.senderId!)) {
      throw new Error('Message cannot be edited');
    }

    if (this.isDeleted()) {
      throw new Error('Cannot edit a deleted message');
    }

    return new Message({
      ...this.props,
      content: newContent,
      editedAt: new Date(),
    });
  }

  public deleteMessage(): Message {
    return new Message({
      ...this.props,
      content: MessageContent.create('[deleted]'),
      status: MessageStatus.FAILED,
      editedAt: new Date(),
    });
  }

  // Serialization
  public toPrimitives(): {
    id: string;
    conversationId: string;
    senderId: string | null;
    content: string;
    type: string;
    status: string;
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
    editedAt?: string;
    attachmentUrl?: string;
    replyToMessageId?: string;
    reactions: Array<{ emoji: string; userIds: string[] }>;
  } {
    const reactions = this.getReactions();
    const reactionsArray = Array.from(reactions.entries()).map(
      ([emoji, userIds]) => ({
        emoji,
        userIds: userIds.map((id) => id.value),
      }),
    );

    return {
      id: this.props.id.value,
      conversationId: this.props.conversationId.value,
      senderId: this.props.senderId?.value || null,
      content: this.props.content.value,
      type: this.props.type,
      status: this.props.status,
      sentAt: this.props.sentAt.toISOString(),
      deliveredAt: this.props.deliveredAt?.toISOString(),
      readAt: this.props.readAt?.toISOString(),
      editedAt: this.props.editedAt?.toISOString(),
      attachmentUrl: this.attachmentUrl,
      replyToMessageId: this.props.replyToMessageId?.value,
      reactions: reactionsArray,
    };
  }
}
