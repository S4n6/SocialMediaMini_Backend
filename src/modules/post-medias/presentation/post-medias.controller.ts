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
  UploadedFiles,
  BadRequestException,
  Query,
  UseFilters,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { MulterExceptionFilter } from '../../../shared/filters/multer-exception.filter';
import { PostMediaApplicationService } from '../application/interfaces/post-media-application.interface';
import {
  UploadPostMediaDto,
  UpdatePostMediaDto,
  ReorderPostMediaDto,
  GetPostMediasDto,
} from '../application/dto/post-media.dto';

@Controller('post-medias')
@UseGuards(JwtAuthGuard)
export class PostMediasController {
  constructor(
    @Inject('POST_MEDIA_APPLICATION_SERVICE')
    private readonly postMediaApplicationService: PostMediaApplicationService,
  ) {}

  @Post('upload/:postId')
  @UseFilters(MulterExceptionFilter)
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
        fileSize: 50 * 1024 * 1024, // 50MB
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

    const uploadDto = new UploadPostMediaDto();
    uploadDto.postId = postId;

    const results = await this.postMediaApplicationService.uploadPostMedias(
      files,
      uploadDto,
      userId,
    );

    return {
      message: 'Media uploaded successfully',
      data: results,
    };
  }

  @Get()
  async findAll(@Query() query: GetPostMediasDto) {
    const result =
      await this.postMediaApplicationService.getAllPostMedias(query);

    return {
      message: 'Post medias retrieved successfully',
      data: result.items,
      pagination: result.pagination,
    };
  }

  @Get('post/:postId')
  async findByPost(@Param('postId') postId: string) {
    const medias =
      await this.postMediaApplicationService.getPostMediasByPostId(postId);

    return {
      message: 'Post medias retrieved successfully',
      data: medias,
    };
  }

  @Get('signature')
  async getSignature(@Query('folder') folder?: string) {
    const signature =
      await this.postMediaApplicationService.generateCloudinarySignature(
        folder,
      );

    return {
      message: 'Signature generated successfully',
      data: signature,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const media = await this.postMediaApplicationService.getPostMediaById(id);

    return {
      message: 'Post media retrieved successfully',
      data: media,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostMediaDto: UpdatePostMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postMediaApplicationService.updatePostMedia(
      id,
      updatePostMediaDto,
      userId,
    );

    return {
      message: 'Media updated successfully',
      data: result,
    };
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderMedias(
    @Body() reorderDto: ReorderPostMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.postMediaApplicationService.reorderPostMedias(
      reorderDto,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.postMediaApplicationService.deletePostMedia(id, userId);
  }

  @Delete('post/:postId/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAllFromPost(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const medias =
      await this.postMediaApplicationService.getPostMediasByPostId(postId);

    // Delete each media (this will trigger proper authorization checks)
    await Promise.all(
      medias.map((media) =>
        this.postMediaApplicationService.deletePostMedia(media.id, userId),
      ),
    );
  }
}
