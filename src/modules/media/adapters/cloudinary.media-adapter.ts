import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CLOUDINARY } from '../../../config/cloudinary.constant';
import {
  IMediaService,
  UploadResult,
  UploadCredentials,
} from '../media.interface';

/**
 * Adapts the concrete CloudinaryService to the IMediaService contract.
 * This is the default media adapter used when MEDIA_PROVIDER=cloudinary.
 */
@Injectable()
export class CloudinaryMediaAdapter implements IMediaService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    const result = await this.cloudinaryService.uploadFile(
      file,
      folder ?? CLOUDINARY.FOLDER,
    );
    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type,
      resourceType: result.resource_type,
    };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadResult[]> {
    const results = await this.cloudinaryService.uploadMultipleFiles(
      files,
      folder ?? CLOUDINARY.FOLDER,
    );
    return results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      type: r.resource_type,
      resourceType: r.resource_type,
    }));
  }

  async deleteFile(publicId: string): Promise<void> {
    await this.cloudinaryService.deleteFile(publicId);
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    await this.cloudinaryService.deleteMultipleFiles(publicIds);
  }

  async getUploadCredentials(params: {
    folder?: string;
  }): Promise<UploadCredentials> {
    const folder = params.folder ?? CLOUDINARY.FOLDER;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = await this.cloudinaryService.generateSignature({
      timestamp,
      folder,
    });

    return {
      provider: 'cloudinary',
      signature,
      timestamp,
      folder,
      apiKey: CLOUDINARY.API_KEY,
      cloudName: CLOUDINARY.CLOUD_NAME,
    };
  }
}
