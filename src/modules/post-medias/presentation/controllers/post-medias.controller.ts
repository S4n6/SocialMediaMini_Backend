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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../../shared/decorators/currentUser.decorator';
import { MulterExceptionFilter } from '../../../../shared/filters/multer-exception.filter';
import { UploadPostMediasUseCase } from '../../application/use-cases/upload-post-medias/upload-post-medias.use-case';
import { GetPostMediaByIdUseCase } from '../../application/use-cases/get-post-media-by-id/get-post-media-by-id.use-case';
import { GetAllPostMediasUseCase } from '../../application/use-cases/get-all-post-medias/get-all-post-medias.use-case';

export interface UploadPostMediaDto {
  postId: string;
  maxMediaPerPost?: number;
}

export interface GetPostMediasDto {
  page?: number;
  limit?: number;
}

@Controller('post-medias')
@UseGuards(JwtAuthGuard)
export class PostMediasController {
  constructor(
    private readonly uploadPostMediasUseCase: UploadPostMediasUseCase,
    private readonly getPostMediaByIdUseCase: GetPostMediaByIdUseCase,
    private readonly getAllPostMediasUseCase: GetAllPostMediasUseCase,
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
    @Body() uploadDto?: UploadPostMediaDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const results = await this.uploadPostMediasUseCase.execute({
      files,
      postId,
      userId,
      maxMediaPerPost: uploadDto?.maxMediaPerPost,
    });

    return {
      message: 'Media uploaded successfully',
      data: results,
    };
  }

  @Get()
  async findAll(@Query() query: GetPostMediasDto) {
    const result = await this.getAllPostMediasUseCase.execute({
      page: query.page || 1,
      limit: query.limit || 10,
    });

    return {
      message: 'Post medias retrieved successfully',
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const media = await this.getPostMediaByIdUseCase.execute({ id });

    return {
      message: 'Post media retrieved successfully',
      data: media,
    };
  }
}
