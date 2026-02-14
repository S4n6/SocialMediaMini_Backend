import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { UserTestHelper } from '../../helpers/user-test.helper';

/**
 * E2E Tests for User Profile Retrieval
 * Tests GET /users/:id endpoint
 *
 * Coverage:
 * - Retrieve user profile by valid ID
 * - Handle non-existent user (404)
 * - Handle invalid UUID format (400)
 */
describe('Users - Profile Retrieval (E2E)', () => {
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
    helper = new UserTestHelper(app, prisma, 'get_');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await helper.cleanDatabase();

    // Create test user for get operations
    testUser = await helper.createTestUser({
      fullName: 'Test User',
      bio: 'Test bio',
    });
  });

  afterEach(async () => {
    await helper.cleanDatabase();
  });

  describe('GET /users/:id - Success Cases', () => {
    it('should get user profile by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        fullName: testUser.fullName,
        bio: testUser.bio,
        followersCount: 0,
        followingCount: 0,
      });
    });
  });

  describe('GET /users/:id - Error Cases', () => {
    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer()).get(`/users/${fakeId}`).expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer()).get('/users/invalid-id').expect(400);
    });
  });
});
