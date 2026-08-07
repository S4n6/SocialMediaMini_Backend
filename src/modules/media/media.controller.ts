import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { IMediaService } from './media.interface';
import { MEDIA_SERVICE } from './media.tokens';
import { JwtAuthGuard } from '../../shared/guards/jwt.guard';

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    callback(null, true);
  } else {
    callback(new BadRequestException('Only images and videos are allowed'), false);
  }
};

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    @Inject(MEDIA_SERVICE)
    private readonly mediaService: IMediaService,
  ) {}

  /** Upload a single file (server-side) */
  @Post('upload/single')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const result = await this.mediaService.uploadFile(file, folder);
    return {
      message: 'File uploaded successfully',
      data: result,
    };
  }

  /** Upload multiple files (server-side) */
  @Post('upload/multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    const results = await this.mediaService.uploadMultipleFiles(
      files,
      folder,
    );
    return {
      message: 'Files uploaded successfully',
      data: results,
    };
  }

  /**
   * Return upload credentials for a direct client→provider upload.
   *
   * - Cloudinary: returns a signed timestamp the browser uses with the
   *   Cloudinary Upload Widget or Upload API.
   * - S3: returns a presigned PUT URL the browser calls directly.
   *
   * @query folder  Optional folder/prefix override
   */
  @Get('credentials')
  async getUploadCredentials(@Query('folder') folder?: string) {
    const credentials = await this.mediaService.getUploadCredentials({
      folder,
    });
    return {
      message: 'Upload credentials generated successfully',
      data: credentials,
    };
  }

  /** Delete a file by its provider-specific public ID / object key */
  @Delete(':publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    await this.mediaService.deleteFile(publicId);
    return {
      message: 'File deleted successfully',
    };
  }
}
