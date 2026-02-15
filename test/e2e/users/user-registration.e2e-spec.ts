import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { UserTestHelper } from '../../helpers/user-test.helper';

/**
 * E2E Tests for User Registration
 * Tests POST /users endpoint
 *
 * Coverage:
 * - Successful registration with required fields
 * - Successful registration with optional fields
 * - Validation: email format
 * - Validation: password strength
 * - Validation: username format and length
 * - Duplicate detection: email and username
 */
describe('Users - Registration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let helper: UserTestHelper;

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
    helper = new UserTestHelper(app, prisma, 'reg_');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await helper.cleanDatabase();
  });

  afterEach(async () => {
    await helper.cleanDatabase();
  });

  describe('POST /users - Successful Registration', () => {
    it('should create a new user with valid data', async () => {
      const userData = helper.createUserData({
        fullName: 'John Doe',
        bio: 'Software developer',
        location: 'San Francisco',
      });

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

    it('should accept optional profile fields', async () => {
      const uniqueId = Date.now();
      const userData = {
        username: `johnopt${uniqueId}`,
        email: `johnopt${uniqueId}@example.com`,
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

  describe('POST /users - Duplicate Detection', () => {
    it('should reject registration with duplicate email', async () => {
      const userData1 = helper.createUserData({
        fullName: 'User One',
      });

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send(userData1)
        .expect(201);

      // Try to create second user with same email
      const userData2 = helper.createUserData({
        email: userData1.email, // Same email
        fullName: 'User Two',
      });

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData2)
        .expect(400);

      const message =
        typeof response.body.message === 'string'
          ? response.body.message.toLowerCase()
          : '';
      expect(message).toContain('email');
    });

    it('should reject registration with duplicate username', async () => {
      const userData1 = helper.createUserData({
        fullName: 'John Doe',
      });

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send(userData1)
        .expect(201);

      // Try to create second user with same username but different email
      const userData2 = helper.createUserData({
        username: userData1.username, // Same username
        fullName: 'Jane Doe',
      });

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData2)
        .expect(400);

      const message =
        typeof response.body.message === 'string'
          ? response.body.message.toLowerCase()
          : '';
      expect(message).toContain('already exists');
    });
  });

  describe('POST /users - Validation Errors', () => {
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

    it('should reject missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          // missing email, password, fullName
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject password shorter than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Short1!', // 7 chars - under domain minimum of 8
          fullName: 'Test User',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });
});
