import { PartialType } from '@nestjs/mapped-types';
import { CreatePostMediaDto } from './createPostMedia.dto';
import { IsOptional, IsString, IsUrl, IsIn } from 'class-validator';

export class UpdatePostMediaDto extends PartialType(CreatePostMediaDto) {
  @IsOptional()
  @IsUrl({}, { message: 'Media URL must be a valid URL' })
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['image', 'video', 'audio', 'document'], {
    message: 'Media type must be one of: image, video, audio, document',
  })
  mediaType?: string;
}
