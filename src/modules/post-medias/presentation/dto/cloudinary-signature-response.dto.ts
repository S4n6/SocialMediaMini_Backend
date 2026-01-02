import { ApiProperty } from '@nestjs/swagger';

export class CloudinarySignatureResponseDto {
  @ApiProperty({
    description: 'Generated signature for upload authentication',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
  })
  signature: string;

  @ApiProperty({
    description: 'Unix timestamp used for signature generation',
    example: 1634567890,
  })
  timestamp: number;

  @ApiProperty({
    description: 'Target folder in Cloudinary',
    example: 'SocialMedia/posts',
  })
  folder: string;

  @ApiProperty({
    description: 'Cloudinary API key (safe to expose to client)',
    example: '123456789012345',
  })
  apiKey: string;

  @ApiProperty({
    description: 'Cloudinary cloud name',
    example: 'your-cloud-name',
  })
  cloudName: string;
}

export class GenerateSignatureResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Cloudinary signature generated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Cloudinary signature data',
    type: CloudinarySignatureResponseDto,
  })
  data: CloudinarySignatureResponseDto;
}
