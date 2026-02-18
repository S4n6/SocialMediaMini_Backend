import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { TestDatabaseHelper } from '../../helpers/test-database.helper';
import { AuthTestHelper } from '../../helpers/auth-test.helper';
import { TestDataFactory } from '../../helpers/test-data.factory';
import { VerificationTokenService } from '../../../src/modules/auth/infrastructure/services/verification-token.service';

/**
 * E2E Tests for S3 Presigned URL Generation
 *
 * Coverage:
 * - GET /s3/presigned-url
 * - JWT authentication requirement
 * - Query parameter validation
 * - Presigned URL format validation
 * - Error handling for invalid inputs
 *
 * IMPORTANT NOTES:
 * 1. Requires valid AWS credentials in .env for real S3 integration
 * 2. Tests JWT guard protection
 * 3. Validates presigned URL structure (not actual upload)
 */
describe('S3 - Presigned URL (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let authHelper: AuthTestHelper;
  let verificationTokenService: VerificationTokenService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    dbHelper = new TestDatabaseHelper(prisma);
    authHelper = new AuthTestHelper(app, prisma);
    verificationTokenService = moduleFixture.get<VerificationTokenService>(
      VerificationTokenService,
    );
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database and create authenticated user
    await dbHelper.cleanDatabase();

    const testData = TestDataFactory.createUserData();
    const password = testData.password!; // Non-null assertion since factory always provides password

    // Register user
    const registerResponse = await authHelper.registerUser(testData);
    userId = registerResponse.body.user.id;
    const userEmail = registerResponse.body.user.email;

    // Verify email
    const token = verificationTokenService.generateEmailVerificationToken(
      userId,
      userEmail,
    );
    await authHelper.verifyEmail(token, password);

    // Login to get access token
    const loginResponse = await authHelper.loginUserMobile(userEmail, password);
    accessToken = loginResponse.body.tokens.accessToken;
  });

  describe('GET /s3/presigned-url - Success Cases', () => {
    it('should generate presigned URL with valid parameters (image)', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'profile-photo.jpg',
          fileType: 'image/jpeg',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Presigned URL generated successfully',
        data: {
          uploadUrl: expect.any(String),
          key: expect.any(String),
        },
      });

      // Validate uploadUrl is a valid AWS S3 presigned URL
      const { uploadUrl, key } = response.body.data;
      expect(uploadUrl).toContain('s3');
      expect(uploadUrl).toContain('amazonaws.com');
      expect(uploadUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(uploadUrl).toContain('X-Amz-Credential=');
      expect(uploadUrl).toContain('X-Amz-Signature=');

      // Validate key format: uploads/timestamp-filename
      expect(key).toMatch(/^uploads\/\d+-profile-photo\.jpg$/);
    });

    it('should generate presigned URL for PNG image', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'screenshot.png',
          fileType: 'image/png',
        })
        .expect(200);

      expect(response.body.data.key).toMatch(/^uploads\/\d+-screenshot\.png$/);
    });

    it('should generate presigned URL for video', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'video-clip.mp4',
          fileType: 'video/mp4',
        })
        .expect(200);

      expect(response.body.data.key).toMatch(/^uploads\/\d+-video-clip\.mp4$/);
    });

    it('should handle filenames with spaces', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'my photo from beach.jpg',
          fileType: 'image/jpeg',
        })
        .expect(200);

      expect(response.body.data.key).toContain('my photo from beach.jpg');
    });

    it('should generate unique keys for same filename (timestamp)', async () => {
      const query = {
        fileName: 'photo.jpg',
        fileType: 'image/jpeg',
      };

      const response1 = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response2 = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);

      expect(response1.body.data.key).not.toBe(response2.body.data.key);
    });
  });

  describe('GET /s3/presigned-url - Authentication', () => {
    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .query({
          fileName: 'photo.jpg',
          fileType: 'image/jpeg',
        })
        .expect(401);
    });

    it('should return 401 with invalid access token', async () => {
      await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', 'Bearer invalid-token')
        .query({
          fileName: 'photo.jpg',
          fileType: 'image/jpeg',
        })
        .expect(401);
    });

    it('should return 401 with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', 'InvalidFormat')
        .query({
          fileName: 'photo.jpg',
          fileType: 'image/jpeg',
        })
        .expect(401);
    });
  });

  describe('GET /s3/presigned-url - Validation Errors', () => {
    it('should return 400 when fileName is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileType: 'image/jpeg',
        })
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('fileName');
    });

    it('should return 400 when fileType is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'photo.jpg',
        })
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('fileType');
    });

    it('should return 400 when both parameters are missing', async () => {
      await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 400 when fileName is empty string', async () => {
      await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: '',
          fileType: 'image/jpeg',
        })
        .expect(400);
    });

    it('should return 400 when fileType is empty string', async () => {
      await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'photo.jpg',
          fileType: '',
        })
        .expect(400);
    });
  });

  describe('GET /s3/presigned-url - Edge Cases', () => {
    it('should handle very long filenames', async () => {
      const longFileName = 'a'.repeat(200) + '.jpg';

      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: longFileName,
          fileType: 'image/jpeg',
        })
        .expect(200);

      expect(response.body.data.key).toContain(longFileName);
    });

    it('should handle special characters in filename', async () => {
      const specialFileName = 'photo-@-#-$-%.jpg';

      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: specialFileName,
          fileType: 'image/jpeg',
        })
        .expect(200);

      expect(response.body.data.key).toContain(specialFileName);
    });

    it('should handle uncommon MIME types', async () => {
      const response = await request(app.getHttpServer())
        .get('/s3/presigned-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          fileName: 'document.pdf',
          fileType: 'application/pdf',
        })
        .expect(200);

      expect(response.body.data.uploadUrl).toContain('amazonaws.com');
    });
  });
});
