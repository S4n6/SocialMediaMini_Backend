import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CleanupMediaDto {
  @ApiProperty({
    description: 'Array of Cloudinary public IDs to be deleted',
    example: [
      'SocialMedia/posts/post_1234567890_0',
      'SocialMedia/posts/post_1234567890_1',
    ],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one public ID is required' })
  @IsString({ each: true, message: 'Each public ID must be a string' })
  @IsNotEmpty({ each: true, message: 'Public ID cannot be empty' })
  publicIds: string[];
}
