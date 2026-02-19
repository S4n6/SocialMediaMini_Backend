import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
    this.cdnUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL') || '';

    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async getPresignedUrl(
    fileName: string,
    fileType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 300,
      });

      return { uploadUrl, key };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to generate presigned URL',
      );
    }
  }

  getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
  }
}
