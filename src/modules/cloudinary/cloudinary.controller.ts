import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.guard';

@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload/single')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/')
        ) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only images and videos are allowed'),
            false,
          );
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.cloudinaryService.uploadFile(file, folder);

    return {
      message: 'File uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        thumbnail: this.cloudinaryService.getThumbnail(result.public_id),
      },
    };
  }

  @Post('upload/multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype.startsWith('image/') ||
          file.mimetype.startsWith('video/')
        ) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only images and videos are allowed'),
            false,
          );
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    const results = await this.cloudinaryService.uploadMultipleFiles(
      files,
      folder,
    );

    return {
      message: 'Files uploaded successfully',
      data: results.map((result) => ({
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        thumbnail: this.cloudinaryService.getThumbnail(result.public_id),
      })),
    };
  }

  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only images are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for images
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const result = await this.cloudinaryService.uploadImage(file, folder);

    return {
      message: 'Image uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        thumbnail: this.cloudinaryService.getThumbnail(result.public_id),
      },
    };
  }

  @Post('upload/video')
  @UseInterceptors(
    FileInterceptor('video', {
      fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('video/')) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only videos are allowed'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB for videos
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    const result = await this.cloudinaryService.uploadVideo(file, folder);

    return {
      message: 'Video uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      },
    };
  }

  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    const result = await this.cloudinaryService.deleteFile(publicId);

    return {
      message: 'File deleted successfully',
      data: result,
    };
  }
}
