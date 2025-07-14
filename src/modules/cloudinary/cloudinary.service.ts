import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { CloudinaryResponse } from './dto/cloudinary.response';
import { CLOUDINARY } from 'src/constants/cloudinary.constant';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = CLOUDINARY.FOLDER,
  ): Promise<CloudinaryResponse> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'image',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
            ],
            format: 'webp',
          },
          (error, result) => {
            if (error) {
              reject(new BadRequestException('Image upload failed'));
            } else {
              resolve(result as unknown as CloudinaryResponse);
            }
          },
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      throw new BadRequestException('Image upload failed');
    }
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'social-media/videos',
  ): Promise<CloudinaryResponse> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'video',
            transformation: [
              { width: 1280, height: 720, crop: 'limit', quality: 'auto' },
            ],
            format: 'mp4',
          },
          (error, result) => {
            if (error) {
              reject(new BadRequestException('Video upload failed'));
            } else {
              resolve(result as unknown as CloudinaryResponse);
            }
          },
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      throw new BadRequestException('Video upload failed');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = CLOUDINARY.FOLDER,
  ): Promise<CloudinaryResponse> {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (isImage) {
      return this.uploadImage(file, `${folder}/images`);
    } else if (isVideo) {
      return this.uploadVideo(file, `${folder}/videos`);
    } else {
      throw new BadRequestException('Only images and videos are allowed');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = CLOUDINARY.FOLDER,
  ): Promise<CloudinaryResponse[]> {
    console.log('Service received files:', files.length);
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException('Failed to delete file');
    }
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<any> {
    try {
      return await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      throw new BadRequestException('Failed to delete files');
    }
  }

  // Get optimized URL for different sizes
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      width: options.width || 'auto',
      height: options.height || 'auto',
      crop: 'fill',
      quality: options.quality || 'auto',
      format: options.format || 'auto',
    });
  }

  getThumbnail(publicId: string, size: number = 150): string {
    return cloudinary.url(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    });
  }
}
