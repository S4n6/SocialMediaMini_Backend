import { BaseId } from '../../../shared/domain';
import { ParticipantRole } from './enums';

// ID Value Objects
export class ConversationId extends BaseId {
  private constructor(value: string) {
    super(value, 'ConversationId');
  }

  public static create(value?: string): ConversationId {
    return new ConversationId(value || BaseId.generate());
  }

  public static fromString(value: string): ConversationId {
    return new ConversationId(value);
  }
}

export class MessageId extends BaseId {
  private constructor(value: string) {
    super(value, 'MessageId');
  }

  public static create(value?: string): MessageId {
    return new MessageId(value || BaseId.generate());
  }

  public static fromString(value: string): MessageId {
    return new MessageId(value);
  }
}

export class UserId extends BaseId {
  private constructor(value: string) {
    super(value, 'UserId');
  }

  public static create(value?: string): UserId {
    return new UserId(value || BaseId.generate());
  }

  public static fromString(value: string): UserId {
    return new UserId(value);
  }
}

// Content Value Objects
export class MessageContent {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): MessageContent {
    if (!value || value.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (value.length > 10000) {
      throw new Error('Message content cannot exceed 10000 characters');
    }

    return new MessageContent(value.trim());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: MessageContent): boolean {
    return this._value === other._value;
  }

  public isEmpty(): boolean {
    return this._value.trim().length === 0;
  }

  public wordCount(): number {
    return this._value.split(/\s+/).filter((word) => word.length > 0).length;
  }
}

export class ConversationTitle {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(value: string): ConversationTitle {
    if (!value || value.trim().length === 0) {
      throw new Error('Conversation title cannot be empty');
    }

    if (value.length > 255) {
      throw new Error('Conversation title cannot exceed 255 characters');
    }

    return new ConversationTitle(value.trim());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: ConversationTitle): boolean {
    return this._value === other._value;
  }
}

// Participant Value Object
export class ConversationParticipant {
  private constructor(
    private readonly _userId: UserId,
    private readonly _joinedAt: Date,
    private readonly _role: ParticipantRole = ParticipantRole.MEMBER,
    private readonly _leftAt?: Date,
  ) {}

  public static create(
    userId: UserId,
    joinedAt: Date,
    role: ParticipantRole = ParticipantRole.MEMBER,
    leftAt?: Date,
  ): ConversationParticipant {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!joinedAt) {
      throw new Error('Joined at date is required');
    }

    if (leftAt && leftAt < joinedAt) {
      throw new Error('Left at date cannot be before joined at date');
    }

    return new ConversationParticipant(userId, joinedAt, role, leftAt);
  }

  public get userId(): UserId {
    return this._userId;
  }

  public get joinedAt(): Date {
    return this._joinedAt;
  }

  public get role(): ParticipantRole {
    return this._role;
  }

  public get leftAt(): Date | undefined {
    return this._leftAt;
  }

  public get isActive(): boolean {
    return !this._leftAt;
  }

  public isAdmin(): boolean {
    return this._role === ParticipantRole.ADMIN;
  }

  public isModerator(): boolean {
    return (
      this._role === ParticipantRole.MODERATOR ||
      this._role === ParticipantRole.ADMIN
    );
  }

  public canModerate(): boolean {
    return (
      this._role === ParticipantRole.ADMIN ||
      this._role === ParticipantRole.MODERATOR
    );
  }

  public leave(leftAt: Date): ConversationParticipant {
    if (leftAt < this._joinedAt) {
      throw new Error('Left at date cannot be before joined at date');
    }

    return new ConversationParticipant(
      this._userId,
      this._joinedAt,
      this._role,
      leftAt,
    );
  }

  public equals(other: ConversationParticipant): boolean {
    return (
      this._userId.equals(other._userId) &&
      this._joinedAt.getTime() === other._joinedAt.getTime() &&
      this._role === other._role &&
      this._leftAt?.getTime() === other._leftAt?.getTime()
    );
  }
}

// Message Metadata Value Object
export class MessageMetadata {
  private constructor(
    private readonly _deliveredAt?: Date,
    private readonly _readAt?: Date,
    private readonly _editedAt?: Date,
    private readonly _replyToMessageId?: MessageId,
    private readonly _reactions?: Map<string, UserId[]>,
  ) {}

  public static create(
    deliveredAt?: Date,
    readAt?: Date,
    editedAt?: Date,
    replyToMessageId?: MessageId,
    reactions?: Map<string, UserId[]>,
  ): MessageMetadata {
    return new MessageMetadata(
      deliveredAt,
      readAt,
      editedAt,
      replyToMessageId,
      reactions || new Map(),
    );
  }

  public get deliveredAt(): Date | undefined {
    return this._deliveredAt;
  }

  public get readAt(): Date | undefined {
    return this._readAt;
  }

  public get editedAt(): Date | undefined {
    return this._editedAt;
  }

  public get replyToMessageId(): MessageId | undefined {
    return this._replyToMessageId;
  }

  public get reactions(): Map<string, UserId[]> {
    return new Map(this._reactions);
  }

  public get isDelivered(): boolean {
    return !!this._deliveredAt;
  }

  public get isRead(): boolean {
    return !!this._readAt;
  }

  public get isEdited(): boolean {
    return !!this._editedAt;
  }

  public markAsDelivered(deliveredAt: Date): MessageMetadata {
    return new MessageMetadata(
      deliveredAt,
      this._readAt,
      this._editedAt,
      this._replyToMessageId,
      this._reactions,
    );
  }

  public markAsRead(readAt: Date): MessageMetadata {
    return new MessageMetadata(
      this._deliveredAt,
      readAt,
      this._editedAt,
      this._replyToMessageId,
      this._reactions,
    );
  }

  public markAsEdited(editedAt: Date): MessageMetadata {
    return new MessageMetadata(
      this._deliveredAt,
      this._readAt,
      editedAt,
      this._replyToMessageId,
      this._reactions,
    );
  }

  public addReaction(emoji: string, userId: UserId): MessageMetadata {
    const newReactions = new Map(this._reactions);
    const userIds = newReactions.get(emoji) || [];

    if (!userIds.some((id) => id.equals(userId))) {
      userIds.push(userId);
      newReactions.set(emoji, userIds);
    }

    return new MessageMetadata(
      this._deliveredAt,
      this._readAt,
      this._editedAt,
      this._replyToMessageId,
      newReactions,
    );
  }

  public removeReaction(emoji: string, userId: UserId): MessageMetadata {
    const newReactions = new Map(this._reactions);
    const userIds = newReactions.get(emoji) || [];
    const filteredUserIds = userIds.filter((id) => !id.equals(userId));

    if (filteredUserIds.length === 0) {
      newReactions.delete(emoji);
    } else {
      newReactions.set(emoji, filteredUserIds);
    }

    return new MessageMetadata(
      this._deliveredAt,
      this._readAt,
      this._editedAt,
      this._replyToMessageId,
      newReactions,
    );
  }
}

// Attachment Value Object
export class MessageAttachment {
  private constructor(
    private readonly _type: string,
    private readonly _url: string,
    private readonly _fileName?: string,
    private readonly _fileSize?: number,
    private readonly _mimeType?: string,
    private readonly _thumbnailUrl?: string,
    private readonly _duration?: number, // for audio/video in seconds
  ) {}

  public static create(
    type: string,
    url: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    thumbnailUrl?: string,
    duration?: number,
  ): MessageAttachment {
    if (!type || !url) {
      throw new Error('Attachment type and URL are required');
    }

    if (!this.isValidUrl(url)) {
      throw new Error('Invalid attachment URL');
    }

    if (fileSize && fileSize <= 0) {
      throw new Error('File size must be positive');
    }

    if (duration && duration < 0) {
      throw new Error('Duration cannot be negative');
    }

    return new MessageAttachment(
      type,
      url,
      fileName,
      fileSize,
      mimeType,
      thumbnailUrl,
      duration,
    );
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public get type(): string {
    return this._type;
  }

  public get url(): string {
    return this._url;
  }

  public get fileName(): string | undefined {
    return this._fileName;
  }

  public get fileSize(): number | undefined {
    return this._fileSize;
  }

  public get mimeType(): string | undefined {
    return this._mimeType;
  }

  public get thumbnailUrl(): string | undefined {
    return this._thumbnailUrl;
  }

  public get duration(): number | undefined {
    return this._duration;
  }

  public isImage(): boolean {
    return (
      this._type === 'image' || this._mimeType?.startsWith('image/') || false
    );
  }

  public isVideo(): boolean {
    return (
      this._type === 'video' || this._mimeType?.startsWith('video/') || false
    );
  }

  public isAudio(): boolean {
    return (
      this._type === 'audio' || this._mimeType?.startsWith('audio/') || false
    );
  }

  public equals(other: MessageAttachment): boolean {
    return (
      this._type === other._type &&
      this._url === other._url &&
      this._fileName === other._fileName &&
      this._fileSize === other._fileSize &&
      this._mimeType === other._mimeType
    );
  }
}

// Location Value Object
export class MessageLocation {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number,
    private readonly _address?: string,
    private readonly _name?: string,
  ) {}

  public static create(
    latitude: number,
    longitude: number,
    address?: string,
    name?: string,
  ): MessageLocation {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    return new MessageLocation(latitude, longitude, address, name);
  }

  public get latitude(): number {
    return this._latitude;
  }

  public get longitude(): number {
    return this._longitude;
  }

  public get address(): string | undefined {
    return this._address;
  }

  public get name(): string | undefined {
    return this._name;
  }

  public equals(other: MessageLocation): boolean {
    return (
      this._latitude === other._latitude &&
      this._longitude === other._longitude &&
      this._address === other._address &&
      this._name === other._name
    );
  }
}
