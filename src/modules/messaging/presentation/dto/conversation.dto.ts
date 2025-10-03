import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrivateConversationDto {
  @ApiProperty({
    description: 'Array of exactly 2 user IDs for private conversation',
    example: ['user1-uuid', 'user2-uuid'],
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  participantIds: [string, string];
}

export class CreateGroupConversationDto {
  @ApiProperty({
    description: 'Title of the group conversation',
    example: 'Project Team Chat',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Array of user IDs to be participants',
    example: ['user1-uuid', 'user2-uuid', 'user3-uuid'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];
}

export class UpdateConversationTitleDto {
  @ApiProperty({
    description: 'New title for the conversation',
    example: 'Updated Team Chat',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class AddParticipantDto {
  @ApiProperty({
    description: 'User ID to add to the conversation',
    example: 'user-uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class RemoveParticipantDto {
  @ApiProperty({
    description: 'User ID to remove from the conversation',
    example: 'user-uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class GetConversationsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of conversations to return',
    example: 20,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

export class ConversationResponseDto {
  @ApiProperty({ example: 'conv-uuid' })
  id: string;

  @ApiProperty({ example: 'private' })
  type: string;

  @ApiProperty({ example: 'Team Chat', required: false })
  title?: string;

  @ApiProperty({ example: 'user-uuid' })
  createdBy: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  updatedAt: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  lastMessageAt?: string;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiProperty({ type: [Object] })
  participants: Array<{
    userId: string;
    joinedAt: string;
    role: string;
    leftAt?: string;
  }>;
}

export class ConversationWithLastMessageDto extends ConversationResponseDto {
  @ApiPropertyOptional({ type: Object })
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    senderId: string | null;
    sentAt: string;
  };

  @ApiProperty({ example: 5 })
  unreadCount: number;
}
