import { Injectable } from '@nestjs/common';
import { PostMediaDomainService } from '../../domain/services/post-media-domain.service';

export interface GenerateCloudinarySignatureQuery {
  folder?: string;
}

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

@Injectable()
export class GenerateCloudinarySignatureUseCase {
  constructor(
    private readonly postMediaDomainService: PostMediaDomainService,
  ) {}

  async execute(
    query: GenerateCloudinarySignatureQuery,
  ): Promise<CloudinarySignatureResult> {
    return await this.postMediaDomainService.generateCloudinarySignature(
      query.folder || 'SocialMedia/posts',
    );
  }
}
