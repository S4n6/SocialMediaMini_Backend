import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===== REQUEST DTOs =====

export class CreatePostMediaRequestDto {
  @ApiProperty({ description: 'Media URL' })
  @IsString()
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Media type', enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  type: 'image' | 'video';

  @ApiProperty({ description: 'Display order' })
  @IsNumber()
  @Min(0)
  order: number;
}

export class CreatePostRequestDto {
  @ApiPropertyOptional({
    description: 'Post content',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Post content cannot exceed 2000 characters' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Post privacy setting',
    enum: ['PUBLIC', 'PRIVATE', 'FOLLOWERS'],
    default: 'PUBLIC',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(['PUBLIC', 'PRIVATE', 'FOLLOWERS'])
  @IsOptional()
  privacy?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS';

  @ApiPropertyOptional({
    description: 'Media attachments',
    type: [CreatePostMediaRequestDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaRequestDto)
  media?: CreatePostMediaRequestDto[];

  @ApiPropertyOptional({
    description: 'Post hashtags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

export class UpdatePostRequestDto {
  @ApiPropertyOptional({
    description: 'Updated post content',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Post content cannot exceed 2000 characters' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated privacy setting',
    enum: ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(['PUBLIC', 'PRIVATE', 'FOLLOWERS'])
  privacy?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS';

  @ApiPropertyOptional({
    description: 'Updated media attachments',
    type: [CreatePostMediaRequestDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaRequestDto)
  media?: CreatePostMediaRequestDto[];

  @ApiPropertyOptional({
    description: 'Updated hashtags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

export class GetPostsQueryRequestDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by privacy level',
    enum: ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'],
  })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'])
  privacy?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

  @ApiPropertyOptional({ description: 'Filter by hashtag' })
  @IsOptional()
  @IsString()
  hashtag?: string;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'oldest', 'most_liked', 'most_commented'],
    default: 'newest',
  })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most_liked', 'most_commented'])
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented' = 'newest';
}

export class CreateReactionRequestDto {
  @ApiProperty({
    description: 'Reaction type',
    enum: ['LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY'],
  })
  @IsEnum(['LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'ANGRY'])
  type: 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'ANGRY';
}

export class CreateCommentRequestDto {
  @ApiProperty({
    description: 'Comment content',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
