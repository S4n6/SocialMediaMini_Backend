import { Injectable, Inject } from '@nestjs/common';
import { CloudinaryService } from '../../ports/services/cloudinary.service';
import { CLOUDINARY_SERVICE } from '../../../tokens';

export interface GenerateCloudinarySignatureCommand {
  folder?: string;
}

export interface GenerateCloudinarySignatureResult {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

@Injectable()
export class GenerateCloudinarySignatureUseCase {
  constructor(
    @Inject(CLOUDINARY_SERVICE)
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    command: GenerateCloudinarySignatureCommand,
  ): Promise<GenerateCloudinarySignatureResult> {
    const folder = command.folder || 'SocialMedia/posts';
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = await this.cloudinaryService.generateSignature({
      timestamp,
      folder,
    });

    return {
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    };
  }
}
