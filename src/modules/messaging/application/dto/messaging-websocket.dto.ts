import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDate,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Conversation Management DTOs
export class JoinConversationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;
}

export class LeaveConversationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;
}

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  @IsUUID(undefined, { each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: 'PRIVATE' | 'GROUP' = 'PRIVATE';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// Message DTOs
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  GIF = 'GIF',
  STICKER = 'STICKER',
  LOCATION = 'LOCATION',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsString()
  @IsUUID()
  replyToMessageId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageLocationDto)
  location?: MessageLocationDto;

  @IsOptional()
  @IsString()
  tempId?: string; // Client-side temporary ID for optimistic updates
}

export class MessageLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class EditMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class DeleteMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  messageId: string;
}

export class ReactToMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}

export class RemoveReactionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}

// Message Status DTOs
export class MarkMessageDeliveredDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  messageId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deliveredAt?: Date;
}

export class MarkMessageReadDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  messageId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readAt?: Date;
}

export class MarkConversationReadDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readAt?: Date;
}

// Typing Indicators DTOs
export class StartTypingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;
}

export class StopTypingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;
}

// Online Status DTOs
export class UpdateOnlineStatusDto {
  @IsBoolean()
  isOnline: boolean;

  @IsOptional()
  @IsString()
  lastSeenAt?: string;
}

// Response DTOs
export class MessageDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsString()
  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  senderId?: string;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsEnum(MessageStatus)
  status: MessageStatus;

  @Type(() => Date)
  sentAt: Date;

  @IsOptional()
  @Type(() => Date)
  deliveredAt?: Date;

  @IsOptional()
  @Type(() => Date)
  readAt?: Date;

  @IsOptional()
  @Type(() => Date)
  editedAt?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @IsOptional()
  @IsString()
  @IsUUID()
  replyToMessageId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageLocationDto)
  location?: MessageLocationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageReactionDto)
  reactions?: MessageReactionDto[];

  // Additional fields for WebSocket
  @IsOptional()
  senderName?: string;

  @IsOptional()
  senderAvatar?: string;

  @IsOptional()
  @IsString()
  tempId?: string;

  @IsOptional()
  @IsBoolean()
  isSystemMessage?: boolean;

  @IsOptional()
  replyToMessage?: Partial<MessageDto>;
}

export class MessageReactionDto {
  @IsString()
  emoji: string;

  @IsArray()
  @IsString({ each: true })
  @IsUUID(undefined, { each: true })
  userIds: string[];

  @IsNumber()
  @Min(0)
  count: number;
}

export class ConversationDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsString()
  type: 'PRIVATE' | 'GROUP';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationParticipantDto)
  participants: ConversationParticipantDto[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsString()
  @IsUUID()
  createdBy: string;

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Date)
  updatedAt: Date;

  @IsOptional()
  @Type(() => Date)
  lastMessageAt?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageDto)
  lastMessage?: MessageDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unreadCount?: number;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConversationSettingsDto)
  settings?: ConversationSettingsDto;
}

export class ConversationParticipantDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  role: string;

  @Type(() => Date)
  joinedAt: Date;

  @IsOptional()
  @Type(() => Date)
  leftAt?: Date;

  @IsBoolean()
  isActive: boolean;

  // Additional fields for WebSocket
  @IsOptional()
  userName?: string;

  @IsOptional()
  userAvatar?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @Type(() => Date)
  lastSeenAt?: Date;
}

export class ConversationSettingsDto {
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;

  @IsOptional()
  @Type(() => Date)
  muteUntil?: Date;

  @IsOptional()
  @IsBoolean()
  autoDeleteMessages?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  autoDeleteDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(100)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  allowInviteLinks?: boolean;

  @IsOptional()
  @IsBoolean()
  adminOnlyMessaging?: boolean;
}

// Typing Indicator Response DTOs
export class TypingIndicatorDto {
  @IsString()
  @IsUUID()
  conversationId: string;

  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  userName: string;

  @IsBoolean()
  isTyping: boolean;

  @Type(() => Date)
  timestamp: Date;
}

// Online Status Response DTOs
export class OnlineStatusDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsBoolean()
  isOnline: boolean;

  @IsOptional()
  @Type(() => Date)
  lastSeenAt?: Date;

  @Type(() => Date)
  timestamp: Date;
}

// Conversation Updates DTOs
export class ConversationUpdateDto {
  @IsString()
  @IsUUID()
  conversationId: string;

  @IsString()
  updateType:
    | 'participant_added'
    | 'participant_removed'
    | 'title_changed'
    | 'settings_updated'
    | 'archived'
    | 'unarchived';

  @IsOptional()
  data?: any;

  @Type(() => Date)
  timestamp: Date;

  @IsOptional()
  @IsString()
  @IsUUID()
  updatedBy?: string;
}
