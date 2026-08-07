import { Injectable, NotImplementedException } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';
import {
  IMediaService,
  UploadResult,
  UploadCredentials,
} from '../media.interface';

/**
 * Adapts the S3Service to the IMediaService contract.
 * Used when MEDIA_PROVIDER=s3.
 *
 * Note: S3 is a pure object store — it does not perform server-side
 * image/video transcoding.  Files are stored as-is and served via a
 * public URL or CloudFront CDN.
 */
@Injectable()
export class S3MediaAdapter implements IMediaService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    const key = `${folder ?? 'uploads'}/${Date.now()}-${file.originalname}`;
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    const url = this.s3Service.getPublicUrl(key);
    return {
      url,
      publicId: key,
      type: resourceType,
      resourceType,
    };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.uploadFile(f, folder)));
  }

  async deleteFile(_publicId: string): Promise<void> {
    // AWS SDK DeleteObjectCommand — not yet implemented.
    // Tracked: add @aws-sdk/client-s3 DeleteObjectCommand.
    throw new NotImplementedException(
      'S3 delete is not yet implemented. Add DeleteObjectCommand from @aws-sdk/client-s3.',
    );
  }

  async deleteMultipleFiles(_publicIds: string[]): Promise<void> {
    throw new NotImplementedException(
      'S3 bulk delete is not yet implemented. Add DeleteObjectsCommand from @aws-sdk/client-s3.',
    );
  }

  async getUploadCredentials(params: {
    folder?: string;
  }): Promise<UploadCredentials> {
    const fileName = `${Date.now()}-upload`;

    const { uploadUrl, key } = await this.s3Service.getPresignedUrl(
      fileName,
      'application/octet-stream',
    );

    return {
      provider: 's3',
      uploadUrl,
      key,
      expiresIn: 300,
    };
  }
}
