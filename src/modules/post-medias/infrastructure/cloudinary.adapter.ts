import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import {
  CloudinaryService as DomainCloudinaryService,
  UploadedFile,
} from '../domain/services/post-media-domain.service';

@Injectable()
export class CloudinaryAdapter implements DomainCloudinaryService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadedFile[]> {
    const uploadedFiles = await this.cloudinaryService.uploadMultipleFiles(
      files,
      folder,
    );

    return uploadedFiles.map((file) => ({
      url: file.secure_url,
      type: file.resource_type,
      resourceType: file.resource_type,
    }));
  }

  async generateSignature(params: any): Promise<string> {
    return await this.cloudinaryService.generateSignature(params);
  }
}
