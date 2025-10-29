/**
 * Request DTOs for Comment Controller
 *
 * These DTOs handle HTTP request validation and transformation
 * from external API calls to internal application commands.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsUUID,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { COMMENT_CONSTANTS, REACTION_TYPES } from '../../constants';

// ========== CREATE COMMENT ==========

export class CreateCommentRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(COMMENT_CONSTANTS.MIN_CONTENT_LENGTH, {
    message: `Content must be at least ${COMMENT_CONSTANTS.MIN_CONTENT_LENGTH} character`,
  })
  @MaxLength(COMMENT_CONSTANTS.MAX_CONTENT_LENGTH, {
    message: `Content cannot exceed ${COMMENT_CONSTANTS.MAX_CONTENT_LENGTH} characters`,
  })
  @Transform(({ value }) => value?.trim())
  content: string;

  @IsUUID('4', { message: 'Post ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}

// ========== UPDATE COMMENT ==========

export class UpdateCommentRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(COMMENT_CONSTANTS.MIN_CONTENT_LENGTH, {
    message: `Content must be at least ${COMMENT_CONSTANTS.MIN_CONTENT_LENGTH} character`,
  })
  @MaxLength(COMMENT_CONSTANTS.MAX_CONTENT_LENGTH, {
    message: `Content cannot exceed ${COMMENT_CONSTANTS.MAX_CONTENT_LENGTH} characters`,
  })
  @Transform(({ value }) => value?.trim())
  content: string;
}

// ========== REACTION ==========

export class AddCommentReactionRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Reaction type is required' })
  @IsIn(Object.values(REACTION_TYPES), {
    message: `Reaction type must be one of: ${Object.values(REACTION_TYPES).join(', ')}`,
  })
  reactionType: string;
}

// ========== QUERY PARAMETERS ==========

export class GetCommentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number = COMMENT_CONSTANTS.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(COMMENT_CONSTANTS.MAX_LIMIT, {
    message: `Limit cannot exceed ${COMMENT_CONSTANTS.MAX_LIMIT}`,
  })
  limit?: number = COMMENT_CONSTANTS.DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(COMMENT_CONSTANTS.SORT_OPTIONS), {
    message: `Sort by must be one of: ${Object.values(COMMENT_CONSTANTS.SORT_OPTIONS).join(', ')}`,
  })
  sortBy?: 'newest' | 'oldest' | 'popular' = COMMENT_CONSTANTS.SORT_OPTIONS
    .NEWEST as 'newest';
}

export class GetRepliesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number = COMMENT_CONSTANTS.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(COMMENT_CONSTANTS.MAX_LIMIT, {
    message: `Limit cannot exceed ${COMMENT_CONSTANTS.MAX_LIMIT}`,
  })
  limit?: number = COMMENT_CONSTANTS.DEFAULT_LIMIT;
}
