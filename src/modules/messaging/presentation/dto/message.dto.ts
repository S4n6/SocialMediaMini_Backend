import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../domain/enums';

export class SendTextMessageDto {
  @ApiProperty({
    description: 'Content of the text message',
    example: 'Hello, how are you?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class SendMediaMessageDto {
  @ApiProperty({
    description: 'Type of media message',
    enum: MessageType,
    example: MessageType.IMAGE,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({
    description: 'URL of the media attachment',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  attachmentUrl: string;

  @ApiPropertyOptional({
    description: 'Optional caption for the media',
    example: 'Check out this image!',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class SendReplyMessageDto {
  @ApiProperty({
    description: 'Content of the reply message',
    example: 'Thanks for the information!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ID of the message being replied to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  replyToMessageId: string;
}

export class MarkMessageAsReadDto {
  @ApiProperty({
    description: 'ID of the message to mark as read',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class TypingIndicatorDto {
  @ApiProperty({
    description: 'ID of the conversation where typing is happening',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello there!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    description: 'Attachments',
  })
  @IsOptional()
  attachments?: any[];

  @ApiPropertyOptional({
    description: 'ID of message being replied to',
  })
  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}

export class EditMessageDto {
  @ApiProperty({
    description: 'New content for the message',
    example: 'Updated message content',
  })
  @IsString()
  @IsNotEmpty()
  newContent: string;
}

export class AddReactionDto {
  @ApiProperty({
    description: 'Emoji for the reaction',
    example: '👍',
  })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}

export class GetMessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Number of messages to return',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (message ID)',
    example: 'msg-uuid',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'msg-uuid' })
  id: string;

  @ApiProperty({ example: 'conv-uuid' })
  conversationId: string;

  @ApiProperty({ example: 'user-uuid', nullable: true })
  senderId: string | null;

  @ApiProperty({ example: 'Hello, world!' })
  content: string;

  @ApiProperty({ example: 'text' })
  type: string;

  @ApiProperty({ example: 'sent' })
  status: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  sentAt: string;

  @ApiPropertyOptional({ example: '2023-01-01T00:01:00Z' })
  deliveredAt?: string;

  @ApiPropertyOptional({ example: '2023-01-01T00:02:00Z' })
  readAt?: string;

  @ApiPropertyOptional({ example: '2023-01-01T00:03:00Z' })
  editedAt?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: 'msg-reply-uuid' })
  replyToMessageId?: string;

  @ApiProperty({ type: [Object] })
  reactions: Array<{
    emoji: string;
    userIds: string[];
  }>;
}

export class MessagesResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ example: true })
  hasMore: boolean;

  @ApiPropertyOptional({ example: 'msg-uuid' })
  nextCursor?: string;
}

export class ConversationWithMessagesDto {
  @ApiProperty({ type: Object })
  conversation: {
    id: string;
    type: string;
    title?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string;
    isArchived: boolean;
    participants: Array<{
      userId: string;
      joinedAt: string;
      role: string;
      leftAt?: string;
    }>;
  };

  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ example: true })
  hasMoreMessages: boolean;

  @ApiPropertyOptional({ example: 'msg-uuid' })
  nextCursor?: string;
}
