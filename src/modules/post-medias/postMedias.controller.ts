import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PostMediasService } from './postMedias.service';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { UpdatePostMediaDto } from './dto/updatePostMedia.dto';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('post-medias')
@UseGuards(JwtAuthGuard)
export class PostMediasController {
  constructor(private readonly postMediasService: PostMediasService) {}

  @Post('upload/single/:postId')
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
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.postMediasService.uploadSingle(
      file,
      postId,
      userId,
    );

    return {
      message: 'Media uploaded successfully',
      data: {
        ...result,
        thumbnail: result.publicId
          ? this.postMediasService.getThumbnail(result.publicId)
          : null,
      },
    };
  }

  @Post('upload/multiple/:postId')
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
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const results = await this.postMediasService.uploadAndCreate(
      files,
      postId,
      userId,
    );

    return {
      message: 'Media uploaded successfully',
      data: results.map((result) => ({
        ...result,
        thumbnail: result.publicId
          ? this.postMediasService.getThumbnail(result.publicId)
          : null,
      })),
    };
  }

  @Get()
  async findAll() {
    const medias = await this.postMediasService.findAll();

    return {
      data: medias.medias.map((media) => ({
        ...media,
        thumbnail: media.publicId
          ? this.postMediasService.getThumbnail(media.publicId)
          : null,
      })),
      pagination: medias.pagination,
    };
  }

  @Get('post/:postId')
  async findByPost(@Param('postId') postId: string) {
    const medias = await this.postMediasService.findByPost(postId);

    return {
      data: medias.map((media) => ({
        ...media,
        thumbnail: media.publicId
          ? this.postMediasService.getThumbnail(media.publicId)
          : null,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const media = await this.postMediasService.findOne(id);

    return {
      data: {
        ...media,
        thumbnail: media.publicId
          ? this.postMediasService.getThumbnail(media.publicId)
          : null,
        optimizedUrls: {
          small: media.publicId
            ? this.postMediasService.getOptimizedMediaUrl(media.publicId, {
                width: 400,
              })
            : null,
          medium: media.publicId
            ? this.postMediasService.getOptimizedMediaUrl(media.publicId, {
                width: 800,
              })
            : null,
          large: media.publicId
            ? this.postMediasService.getOptimizedMediaUrl(media.publicId, {
                width: 1200,
              })
            : null,
        },
      },
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostMediaDto: UpdatePostMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postMediasService.update(
      id,
      updatePostMediaDto,
      userId,
    );

    return {
      message: 'Media updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.postMediasService.remove(id, userId);
  }

  @Delete('post/:postId/all')
  async removeAllFromPost(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postMediasService.removeByPost(postId, userId);
  }
}
