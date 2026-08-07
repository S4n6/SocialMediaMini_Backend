import { Injectable, Inject } from '@nestjs/common';
import { IMediaService, UploadCredentials } from '../../../domain/services/cloudinary.service';
import { CLOUDINARY_SERVICE } from '../../../tokens';

export interface GetUploadCredentialsCommand {
  folder?: string;
}

/**
 * @deprecated rename: use GetUploadCredentialsCommand
 */
export type GenerateCloudinarySignatureCommand = GetUploadCredentialsCommand;

/**
 * Returns provider-specific upload credentials for direct client uploads.
 *
 * Response shape depends on the active MEDIA_PROVIDER:
 *   - cloudinary → { provider, signature, timestamp, apiKey, cloudName, folder }
 *   - s3         → { provider, uploadUrl, key, expiresIn }
 */
@Injectable()
export class GenerateCloudinarySignatureUseCase {
  constructor(
    @Inject(CLOUDINARY_SERVICE)
    private readonly mediaService: IMediaService,
  ) {}

  async execute(
    command: GetUploadCredentialsCommand,
  ): Promise<UploadCredentials> {
    return this.mediaService.getUploadCredentials({
      folder: command.folder,
    });
  }
}
