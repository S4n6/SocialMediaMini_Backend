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
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../../shared/decorators/currentUser.decorator';
import { MulterExceptionFilter } from '../../../../shared/filters/multer-exception.filter';
import { UploadPostMediasUseCase } from '../../application/use-cases/upload-post-medias/upload-post-medias.use-case';
import { GetPostMediaByIdUseCase } from '../../application/use-cases/get-post-media-by-id/get-post-media-by-id.use-case';
import { GetAllPostMediasUseCase } from '../../application/use-cases/get-all-post-medias/get-all-post-medias.use-case';
import { GenerateCloudinarySignatureUseCase } from '../../application/use-cases/generate-cloudinary-signature/generate-cloudinary-signature.use-case';
import { GenerateSignatureDto } from '../dto/generate-signature.dto';
import { GenerateSignatureResponseDto } from '../dto/cloudinary-signature-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export interface UploadPostMediaDto {
  postId: string;
  maxMediaPerPost?: number;
}

export interface GetPostMediasDto {
  page?: number;
  limit?: number;
}

@ApiTags('post-medias')
@ApiBearerAuth()
@Controller('post-medias')
@UseGuards(JwtAuthGuard)
export class PostMediasController {
  constructor(
    private readonly uploadPostMediasUseCase: UploadPostMediasUseCase,
    private readonly getPostMediaByIdUseCase: GetPostMediaByIdUseCase,
    private readonly getAllPostMediasUseCase: GetAllPostMediasUseCase,
    private readonly generateCloudinarySignatureUseCase: GenerateCloudinarySignatureUseCase,
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

  @Post('signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Cloudinary signature for client-side upload',
    description:
      'Generates a signature that allows frontend to upload files directly to Cloudinary with authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Cloudinary signature generated successfully',
    type: GenerateSignatureResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async generateCloudinarySignature(
    @Body(ValidationPipe) signatureDto: GenerateSignatureDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.generateCloudinarySignatureUseCase.execute({
      folder: signatureDto.folder || 'SocialMedia/posts',
    });

    return {
      message: 'Cloudinary signature generated successfully',
      data: result,
    };
  }
}
