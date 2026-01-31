import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { UserTestHelper } from '../../helpers/user-test.helper';

/**
 * E2E Tests for User Email Verification
 * Tests POST /users/:id/verify-email endpoint
 *
 * Coverage:
 * - Successful email verification
 * - Idempotency: verifying already verified email
 * - Handle non-existent user (404)
 */
describe('Users - Email Verification (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let helper: UserTestHelper;
  let testUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as production
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    helper = new UserTestHelper(app, prisma, 'ver_');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await helper.cleanDatabase();

    // Create test user for verification operations
    testUser = await helper.createTestUser({
      fullName: 'Test User',
    });
  });

  afterEach(async () => {
    await helper.cleanDatabase();
  });

  describe('POST /users/:id/verify-email - Success Cases', () => {
    it('should verify user email', async () => {
      const response = await request(app.getHttpServer())
        .post(`/users/${testUser.id}/verify-email`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(dbUser!.isEmailVerified).toBe(true);
      expect(dbUser!.emailVerifiedAt).toBeDefined();
    });

    it('should handle verifying already verified email', async () => {
      // First verification
      const firstResponse = await request(app.getHttpServer())
        .post(`/users/${testUser.id}/verify-email`)
        .expect(200);

      expect(firstResponse.body.success).toBe(true);

      // Second verification (should be idempotent - no error)
      const secondResponse = await request(app.getHttpServer())
        .post(`/users/${testUser.id}/verify-email`)
        .expect(200);

      expect(secondResponse.body.success).toBe(true);

      // Verify user is still verified in database
      const dbUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser!.isEmailVerified).toBe(true);
    });
  });

  describe('POST /users/:id/verify-email - Error Cases', () => {
    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .post(`/users/${fakeId}/verify-email`)
        .expect(404);
    });
  });
});
