import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { S3Service } from './s3.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.guard';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

@Controller('s3')
@UseGuards(JwtAuthGuard)
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Get('presigned-url')
  async getPresignedUrl(@Query() query: GetPresignedUrlDto) {
    const result = await this.s3Service.getPresignedUrl(
      query.fileName,
      query.fileType,
    );

    return {
      message: 'Presigned URL generated successfully',
      data: result,
    };
  }
}
