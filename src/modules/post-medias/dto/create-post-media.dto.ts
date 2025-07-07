import { IsString, IsNotEmpty, IsUrl, IsOptional, IsIn } from 'class-validator';

export class CreatePostMediaDto {
  @IsString()
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  @IsUrl({}, { message: 'Media URL must be a valid URL' })
  @IsNotEmpty({ message: 'Media URL is required' })
  mediaUrl: string;

  @IsOptional()
  @IsString()
  @IsIn(['image', 'video', 'audio', 'document'], {
    message: 'Media type must be one of: image, video, audio, document',
  })
  mediaType?: string;
}


