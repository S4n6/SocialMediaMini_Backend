import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Low-level AWS S3 service.
 *
 * Env vars required when STORAGE_PROVIDER=s3:
 *   AWS_S3_BUCKET_NAME
 *   AWS_REGION
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_CLOUDFRONT_URL  (optional — falls back to direct S3 URL)
 *
 * The constructor no longer throws when these vars are absent so the app
 * can start with STORAGE_PROVIDER=cloudinary without any AWS credentials.
 * Missing vars are only surfaced at call-time via InternalServerErrorException.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  private _s3Client: S3Client | null = null;
  private readonly bucketName: string | undefined;
  private readonly region: string | undefined;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    this.region = this.configService.get<string>('AWS_REGION');
    this.cdnUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL') ?? '';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (accessKeyId && secretAccessKey && this.region) {
      this._s3Client = new S3Client({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`S3 client initialised (region: ${this.region})`);
    } else {
      this.logger.warn(
        'AWS credentials not found — S3 client not initialised. ' +
          'Set STORAGE_PROVIDER=cloudinary to use Cloudinary instead.',
      );
    }
  }

  /** Returns the initialised S3 client or throws a clear error. */
  private get s3Client(): S3Client {
    if (!this._s3Client) {
      throw new InternalServerErrorException(
        'S3 client is not configured. ' +
          'Provide AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION, ' +
          'or set STORAGE_PROVIDER=cloudinary.',
      );
    }
    return this._s3Client;
  }

  /** Returns the bucket name or throws a clear error. */
  private get bucket(): string {
    if (!this.bucketName) {
      throw new InternalServerErrorException(
        'AWS_S3_BUCKET_NAME is not configured.',
      );
    }
    return this.bucketName;
  }

  async getPresignedUrl(
    fileName: string,
    fileType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: fileType,
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 300,
      });
      return { uploadUrl, key };
    } catch (error) {
      this.logger.error('Failed to generate presigned URL', error);
      throw new InternalServerErrorException(
        'Failed to generate presigned URL',
      );
    }
  }

  getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region ?? 'us-east-1'}.amazonaws.com/${key}`;
  }
}
