import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSignatureDto {
  @ApiPropertyOptional({
    description: 'Folder path for organizing uploaded files in Cloudinary',
    example: 'SocialMediaMini/posts',
    default: 'SocialMediaMini/posts',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
