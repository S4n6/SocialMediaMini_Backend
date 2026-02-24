import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Media processing callback status.
 * Sent by the Go worker when processing finishes.
 */
export enum MediaCallbackStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * DTO for the internal media processing callback endpoint.
 *
 * Received from the Go worker after it finishes processing a media file.
 * The worker sends this via HTTP POST to `/internal/media/callback`.
 */
export class MediaProcessingCallbackDto {
  @ApiProperty({
    description: 'ID of the PostMedia entity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  mediaId: string;

  @ApiProperty({
    description: 'ID of the post that owns this media',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'Processing result status',
    enum: MediaCallbackStatus,
    example: MediaCallbackStatus.SUCCESS,
  })
  @IsEnum(MediaCallbackStatus)
  @IsNotEmpty()
  status: MediaCallbackStatus;

  @ApiPropertyOptional({
    description:
      'URL of the processed media file (required when status is success)',
    example: 'https://cdn.example.com/processed/abc123.webp',
  })
  @ValidateIf((o) => o.status === MediaCallbackStatus.SUCCESS)
  @IsString()
  @IsNotEmpty()
  processedUrl?: string;

  @ApiPropertyOptional({
    description:
      'URL of the generated thumbnail (optional, usually for videos)',
    example: 'https://cdn.example.com/thumbnails/abc123-thumb.webp',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Error message when processing failed',
    example: 'FFmpeg exited with code 1: unsupported codec',
  })
  @ValidateIf((o) => o.status === MediaCallbackStatus.FAILED)
  @IsString()
  @IsNotEmpty()
  errorMessage?: string;
}
