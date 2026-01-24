import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * E2E Tests for Users Module
 * Tests complete HTTP request/response cycles through the API
 *
 * Coverage:
 * - User Registration
 * - User Profile Management
 * - Email Verification
 * - User Search & Discovery
 *
 * Note: Follow/Unfollow functionality has been moved to the Follow module
 */
describe('Users API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase();
  });

  afterEach(async () => {
    // Clean database after each test for safety
    await cleanDatabase();
  });

  async function cleanDatabase() {
    // Delete in correct order to respect foreign keys
    await prisma.$transaction([
      prisma.follow.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    // Small delay to ensure database constraints are fully resolved
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  describe('POST /users - User Registration', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
        bio: 'Software developer',
        location: 'San Francisco',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          id: expect.any(String),
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          bio: userData.bio,
          location: userData.location,
          isEmailVerified: false,
          followersCount: 0,
          followingCount: 0,
        },
      });

      // Verify password is not returned
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.passwordHash).toBeUndefined();

      // Verify user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser!.username).toBe(userData.username);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        fullName: 'User One',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          ...userData,
          username: 'user2', // Different username
        })
        .expect(400);

      const message =
        typeof response.body.message === 'string'
          ? response.body.message.toLowerCase()
          : '';
      expect(message).toContain('email');
    });

    it('should reject registration with duplicate username', async () => {
      const userData = {
        username: 'johndoe',
        email: 'john1@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      // Try to create second user with same username
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          ...userData,
          email: 'john2@example.com', // Different email
        })
        .expect(400);

      const message =
        typeof response.body.message === 'string'
          ? response.body.message.toLowerCase()
          : '';
      expect(message).toContain('username');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'SecurePass123!',
          fullName: 'Test User',
        })
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ').toLowerCase()
        : response.body.message.toLowerCase();
      expect(message).toContain('email');
    });

    it('should reject weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123', // Too weak
          fullName: 'Test User',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject invalid username format', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'a', // Too short
          email: 'test@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
        })
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ').toLowerCase()
        : response.body.message.toLowerCase();
      expect(message).toContain('username');
    });

    it('should accept optional profile fields', async () => {
      const userData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
        bio: 'Developer',
        location: 'NYC',
        websiteUrl: 'https://johndoe.com',
        phoneNumber: '+12345678901',
        gender: 'MALE',
        dateOfBirth: '1990-01-01',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.data).toMatchObject({
        bio: userData.bio,
        location: userData.location,
        websiteUrl: userData.websiteUrl,
      });
      // Note: phoneNumber and gender are not returned in UserResponseDto
    });
  });

  describe('GET /users/:id - Get User Profile', () => {
    beforeEach(async () => {
      // Create test user for get operations
      const response = await request(app.getHttpServer()).post('/users').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
        bio: 'Test bio',
      });

      testUser = response.body.data;
    });

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

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer()).get(`/users/${fakeId}`).expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer()).get('/users/invalid-id').expect(400);
    });
  });

  describe('PATCH /users/:id - Update User Profile', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer()).post('/users').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
        bio: 'Original bio',
        location: 'Original City',
      });

      testUser = response.body.data;
    });

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

    it('should reject invalid website URL', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send({
          websiteUrl: 'not-a-valid-url',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/users/${fakeId}`)
        .send({ fullName: 'New Name' })
        .expect(404);
    });
  });

  describe('POST /users/:id/verify-email - Email Verification', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer()).post('/users').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
      });

      testUser = response.body.data;
    });

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
      await request(app.getHttpServer())
        .post(`/users/${testUser.id}/verify-email`)
        .expect(200);

      // Second verification (should be idempotent)
      await request(app.getHttpServer())
        .post(`/users/${testUser.id}/verify-email`)
        .expect(200);

      const dbUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(dbUser!.isEmailVerified).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .post(`/users/${fakeId}/verify-email`)
        .expect(404);
    });
  });

  describe('GET /users/search - User Search', () => {
    beforeEach(async () => {
      // Create multiple users for search
      const users = [
        {
          username: 'johnsmith',
          email: 'john@example.com',
          fullName: 'John Smith',
        },
        {
          username: 'johndoe',
          email: 'johndoe@example.com',
          fullName: 'John Doe',
        },
        {
          username: 'janedoe',
          email: 'jane@example.com',
          fullName: 'Jane Doe',
        },
        {
          username: 'bobsmith',
          email: 'bob@example.com',
          fullName: 'Bob Smith',
        },
      ];

      for (const userData of users) {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            ...userData,
            password: 'SecurePass123!',
          });
      }
    });

    it('should search users by username', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=john')
        .expect(200);

      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.data.users.some((u: any) => u.username.includes('john')),
      ).toBe(true);
    });

    it('should search users by full name', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=Smith')
        .expect(200);

      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.data.users.some((u: any) => u.fullName.includes('Smith')),
      ).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=nonexistentuser')
        .expect(200);

      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should support pagination in search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=doe&page=1&limit=1')
        .expect(200);

      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
      expect(response.body.data.hasMore).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=JOHN')
        .expect(200);

      expect(response.body.data.users.length).toBeGreaterThan(0);
    });
  });
});
