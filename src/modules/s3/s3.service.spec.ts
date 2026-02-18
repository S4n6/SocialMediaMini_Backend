import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { S3Service } from './s3.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3Service (Unit)', () => {
  let service: S3Service;
  let configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AWS_S3_BUCKET_NAME: 'test-bucket',
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      };
      return config[key];
    }),
    get: jest.fn((key: string) => {
      if (key === 'AWS_CLOUDFRONT_URL') return '';
      if (key === 'AWS_REGION') return 'us-east-1';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with AWS config from environment', () => {
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'AWS_S3_BUCKET_NAME',
      );
      expect(configService.getOrThrow).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'AWS_ACCESS_KEY_ID',
      );
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'AWS_SECRET_ACCESS_KEY',
      );
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL with correct parameters', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test?signature=xyz';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const fileName = 'test-photo.jpg';
      const fileType = 'image/jpeg';

      const result = await service.getPresignedUrl(fileName, fileType);

      expect(result).toHaveProperty('uploadUrl', mockUrl);
      expect(result).toHaveProperty('key');
      expect(result.key).toMatch(/^uploads\/\d+-test-photo\.jpg$/);
    });

    it('should generate unique keys based on timestamp', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result1 = await service.getPresignedUrl('photo.jpg', 'image/jpeg');

      // Mock a different timestamp
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const result2 = await service.getPresignedUrl('photo.jpg', 'image/jpeg');

      expect(result1.key).not.toBe(result2.key);
    });

    it('should throw InternalServerErrorException when AWS SDK fails', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('AWS SDK Error'));

      await expect(
        service.getPresignedUrl('photo.jpg', 'image/jpeg'),
      ).rejects.toThrow(InternalServerErrorException);

      await expect(
        service.getPresignedUrl('photo.jpg', 'image/jpeg'),
      ).rejects.toThrow('Failed to generate presigned URL');
    });

    it('should handle special characters in filename', async () => {
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const fileName = 'my-photo-@-#.jpg';
      const result = await service.getPresignedUrl(fileName, 'image/jpeg');

      expect(result.key).toContain(fileName);
    });

    it('should preserve file extension in key', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://mock-url.com');

      const testCases = [
        { fileName: 'photo.jpg', extension: '.jpg' },
        { fileName: 'video.mp4', extension: '.mp4' },
        { fileName: 'document.pdf', extension: '.pdf' },
        { fileName: 'image.png', extension: '.png' },
      ];

      for (const { fileName, extension } of testCases) {
        const result = await service.getPresignedUrl(fileName, 'image/jpeg');
        expect(result.key).toMatch(new RegExp(`${extension}$`));
      }
    });
  });

  describe('getPublicUrl', () => {
    it('should return S3 bucket URL when no CDN configured', () => {
      const key = 'uploads/123-photo.jpg';
      const url = service.getPublicUrl(key);

      expect(url).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/123-photo.jpg',
      );
    });

    it('should return CloudFront URL when CDN is configured', async () => {
      // Create a new mock with CDN URL
      const mockConfigWithCdn = {
        getOrThrow: jest.fn((key: string) => {
          const config: Record<string, string> = {
            AWS_S3_BUCKET_NAME: 'test-bucket',
            AWS_REGION: 'us-east-1',
            AWS_ACCESS_KEY_ID: 'test-access-key',
            AWS_SECRET_ACCESS_KEY: 'test-secret-key',
          };
          return config[key];
        }),
        get: jest.fn((key: string) => {
          if (key === 'AWS_CLOUDFRONT_URL')
            return 'https://d123.cloudfront.net';
          if (key === 'AWS_REGION') return 'us-east-1';
          return null;
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: mockConfigWithCdn,
          },
        ],
      }).compile();

      const serviceWithCdn = module.get<S3Service>(S3Service);
      const key = 'uploads/123-photo.jpg';
      const url = serviceWithCdn.getPublicUrl(key);
      expect(url).toBe('https://d123.cloudfront.net/uploads/123-photo.jpg');
    });
  });
});
