/**
 * Request DTOs for Story Controller
 *
 * These DTOs handle HTTP request validation and transformation
 * from external API calls to internal application commands.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  IsIn,
  ValidateIf,
  IsUrl,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  STORY_TYPES,
  STORY_VALIDATION,
  STORY_ERROR_MESSAGES,
} from '../../constants';

// Custom validation decorator for content or media requirement
function IsContentOrMediaProvided(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isContentOrMediaProvided',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as CreateStoryRequestDto;
          return !!(obj.content?.trim() || obj.mediaUrl?.trim());
        },
        defaultMessage(args: ValidationArguments) {
          return STORY_ERROR_MESSAGES.CONTENT_OR_MEDIA_REQUIRED;
        },
      },
    });
  };
}

// ========== CREATE STORY ==========

export class CreateStoryRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(STORY_VALIDATION.CONTENT_MAX_LENGTH, {
    message: STORY_ERROR_MESSAGES.CONTENT_TOO_LONG,
  })
  @Transform(({ value }) => value?.trim())
  @IsContentOrMediaProvided()
  content?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Media URL must be a valid URL' })
  mediaUrl?: string;

  @ValidateIf((o) => o.mediaUrl)
  @IsString()
  @IsNotEmpty({ message: STORY_ERROR_MESSAGES.MEDIA_TYPE_REQUIRED })
  @IsIn(Object.values(STORY_TYPES), {
    message: STORY_ERROR_MESSAGES.INVALID_STORY_TYPE,
  })
  mediaType?: string;
}

// ========== VIEW STORY ==========

export class ViewStoryRequestDto {
  @IsUUID('4', { message: 'Story ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Story ID is required' })
  storyId: string;
}

// ========== GET USER STORIES ==========

export class GetUserStoriesParamsDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
