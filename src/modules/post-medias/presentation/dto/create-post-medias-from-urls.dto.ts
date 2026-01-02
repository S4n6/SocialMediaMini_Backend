import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostMediaType } from '../../domain/post-media.entity';

export class PostMediaUrlDto {
  @ApiProperty({
    description: 'URL of the media file',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/sample.jpg',
  })
  @IsNotEmpty()
  @IsUrl()
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Type of the media (image or video)',
    enum: PostMediaType,
    example: PostMediaType.IMAGE,
  })
  @IsNotEmpty()
  @IsEnum(PostMediaType)
  type: PostMediaType;

  @ApiPropertyOptional({
    description:
      'Order of the media in the post (will be auto-assigned if not provided)',
    minimum: 1,
    maximum: 10,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  order?: number;
}

export class CreatePostMediasFromUrlsDto {
  @ApiProperty({
    description: 'Array of media URLs and their types',
    type: [PostMediaUrlDto],
    minItems: 1,
    maxItems: 10,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one media URL is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 media files allowed per post' })
  @ValidateNested({ each: true })
  @Type(() => PostMediaUrlDto)
  medias: PostMediaUrlDto[];

  @ApiPropertyOptional({
    description: 'Maximum number of media files allowed per post (default: 10)',
    minimum: 1,
    maximum: 10,
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxMediaPerPost?: number;
}
