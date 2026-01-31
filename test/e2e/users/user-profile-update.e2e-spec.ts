import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { UserTestHelper } from '../../helpers/user-test.helper';

/**
 * E2E Tests for User Profile Update
 * Tests PATCH /users/:id endpoint
 *
 * Coverage:
 * - Full profile update with multiple fields
 * - Partial profile update (single field)
 * - Validation: invalid website URL
 * - Handle non-existent user (404)
 */
describe('Users - Profile Update (E2E)', () => {
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
    helper = new UserTestHelper(app, prisma, 'upd_');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await helper.cleanDatabase();

    // Create test user for update operations
    testUser = await helper.createTestUser({
      fullName: 'Test User',
      bio: 'Original bio',
      location: 'Original City',
    });
  });

  afterEach(async () => {
    await helper.cleanDatabase();
  });

  describe('PATCH /users/:id - Success Cases', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        fullName: 'Updated Name',
        bio: 'Updated bio',
        location: 'New York',
        websiteUrl: 'https://updated.com',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: testUser.id,
        fullName: updateData.fullName,
        bio: updateData.bio,
        location: updateData.location,
        websiteUrl: updateData.websiteUrl,
      });

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(dbUser!.fullName).toBe(updateData.fullName);
      expect(dbUser!.bio).toBe(updateData.bio);
    });

    it('should update only provided fields (partial update)', async () => {
      const updateData = {
        bio: 'Only bio updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toMatchObject({
        bio: updateData.bio,
        fullName: testUser.fullName, // Should remain unchanged
        location: testUser.location, // Should remain unchanged
      });
    });
  });

  describe('PATCH /users/:id - Validation Errors', () => {
    it('should reject invalid website URL', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send({
          websiteUrl: 'not-a-valid-url',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /users/:id - Error Cases', () => {
    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/users/${fakeId}`)
        .send({ fullName: 'New Name' })
        .expect(404);
    });
  });
});
