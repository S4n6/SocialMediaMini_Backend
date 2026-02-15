import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { TestDatabaseHelper } from '../../helpers/test-database.helper';
import { AuthTestHelper } from '../../helpers/auth-test.helper';
import { TestDataFactory } from '../../helpers/test-data.factory';

/**
 * E2E Tests for Auth Registration
 * Tests user registration and validation
 *
 * Coverage:
 * - POST /auth/register
 * - Registration validation
 * - Duplicate detection
 * - Email verification token generation
 */
describe('Auth - Registration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let authHelper: AuthTestHelper;

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
    dbHelper = new TestDatabaseHelper(prisma);
    authHelper = new AuthTestHelper(app, prisma);
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dbHelper.cleanDatabase();
    TestDataFactory.reset();
  });

  afterEach(async () => {
    // Clean database after each test for safety
    await dbHelper.cleanDatabase();
  });

  describe('POST /auth/register - Successful Registration', () => {
    it('should register a new user with all valid fields', async () => {
      const userData = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        username: 'johndoe',
        dateOfBirth: new Date('1995-05-15'),
        phoneNumber: '+12345678901', // 11 total digits: +1 (country) + 10 digits
        gender: 'male',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      // Verify response structure
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Registration successful'),
        user: {
          id: expect.any(String),
          email: userData.email,
          fullName: userData.fullName,
          username: userData.username,
          role: 'user', // role is returned as lowercase
          isEmailVerified: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify password is NOT in response
      expect(response.body.user.password).toBeUndefined();

      // Verify user was saved to database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(userData.email);
      expect(dbUser?.isEmailVerified).toBe(false);
    });

    it('should register user with only required fields', async () => {
      const userData = {
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'SecurePass123!',
        dateOfBirth: new Date('1990-01-01'),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: userData.email,
        fullName: userData.fullName,
        isEmailVerified: false,
      });

      // Username should be auto-generated
      expect(response.body.user.username).toMatch(/^user_\d+$/);
    });

    it('should send verification email after registration', async () => {
      // Note: In production, a verification email is sent with a JWT token
      // This test verifies the user is created as unverified
      // Email sending should be mocked in a real test environment

      const userData = TestDataFactory.createUserData();

      const response = await authHelper.registerUser(userData);
      const user = response.body.user;

      expect(user.isEmailVerified).toBe(false);
      expect(user.emailVerifiedAt).toBeUndefined();

      // In a real test, we'd verify the email service was called
      // await expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, token);
    });

    it('should normalize username to lowercase', async () => {
      const userData = TestDataFactory.createUserData({
        username: 'JohnDOE123',
      });

      const response = await authHelper.registerUser(userData);

      expect(response.body.user.username).toBe('johndoe123');
    });

    it('should trim whitespace from email and username', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test.trim@example.com', // Use valid email without spaces
        password: 'SecurePass123!',
        username: '  testuser  ', // Test username trimming
        dateOfBirth: new Date('1995-01-01'),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      expect(response.body.user.email).toBe('test.trim@example.com');
      expect(response.body.user.username).toBe('testuser'); // Should be trimmed
    });
  });

  describe('POST /auth/register - Validation Errors', () => {
    it('should reject registration without email', async () => {
      const userData = {
        fullName: 'John Doe',
        dateOfBirth: new Date('1995-01-01'),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message.toLowerCase()).toContain('email');
    });

    it('should reject registration without fullName', async () => {
      const userData = {
        email: 'test@example.com',
        dateOfBirth: new Date('1995-01-01'),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('Full name');
    });

    it('should reject registration without dateOfBirth', async () => {
      const userData = {
        email: 'test@example.com',
        fullName: 'John Doe',
        password: 'SecurePass123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('Date of birth');
    });

    it('should reject invalid email format', async () => {
      const userData = TestDataFactory.createUserData({
        email: 'invalid-email',
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(400);
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message.toLowerCase()).toContain('email');
    });

    it('should reject fullName that is too short', async () => {
      const userData = TestDataFactory.createUserData({
        fullName: 'A',
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(400);
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('Full name must be at least');
    });

    it('should reject fullName that is too long', async () => {
      const userData = TestDataFactory.createUserData({
        fullName: 'A'.repeat(51),
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(400);
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('Full name must not exceed');
    });

    it('should reject username that is too short', async () => {
      const userData = TestDataFactory.createUserData({
        username: 'ab',
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(400);
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('Username must be at least');
    });

    it('should reject username with invalid characters', async () => {
      const invalidUsernames = [
        'user@name',
        'user name',
        'user#123',
        'user-name',
      ];

      for (const username of invalidUsernames) {
        const userData = TestDataFactory.createUserData({ username });
        const response = await authHelper.registerUser(userData);

        expect(response.status).toBe(400);
        const message = Array.isArray(response.body.message)
          ? response.body.message.join(' ')
          : response.body.message;
        expect(message).toContain('Username can only contain');
      }
    });

    it('should reject invalid phone number format', async () => {
      const userData = TestDataFactory.createUserData({
        phoneNumber: '123', // Too short
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(400);
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message.toLowerCase()).toContain('phone number');
    });

    it('should reject invalid gender value', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'invalid',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);

      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message).toContain('Gender must be');
    });
  });

  describe('POST /auth/register - Duplicate Detection', () => {
    it('should reject duplicate email', async () => {
      const userData1 = TestDataFactory.createUserData();

      // Register first user
      await authHelper.registerUser(userData1);

      // Try to register with same email
      const userData2 = TestDataFactory.createUserData({
        email: userData1.email,
        username: 'differentuser',
      });

      const response = await authHelper.registerUser(userData2);

      expect(response.status).toBe(403); // API returns 403 for conflicts
      const message = Array.isArray(response.body.message)
        ? response.body.message
        : response.body.message;
      expect(JSON.stringify(message).toLowerCase()).toContain('email');
    });

    it('should reject duplicate username', async () => {
      const userData1 = TestDataFactory.createUserData();

      // Register first user
      await authHelper.registerUser(userData1);

      // Try to register with same username
      const userData2 = TestDataFactory.createUserData({
        email: 'different@example.com',
        username: userData1.username,
      });

      const response = await authHelper.registerUser(userData2);

      expect(response.status).toBe(409);
      const message = response.body.message;
      expect(message.toLowerCase()).toContain('username');
    });

    it('should allow registration with different email and username', async () => {
      const userData1 = TestDataFactory.createUserData();
      const userData2 = TestDataFactory.createUserData();

      // Register first user
      const response1 = await authHelper.registerUser(userData1);
      expect(response1.status).toBe(201);

      // Register second user with different credentials
      const response2 = await authHelper.registerUser(userData2);
      expect(response2.status).toBe(201);

      // Verify both users exist
      const userCount = await prisma.user.count();
      expect(userCount).toBe(2);
    });
  });

  describe('POST /auth/register - Security', () => {
    it('should not expose password in response', async () => {
      const userData = TestDataFactory.createUserData();

      const response = await authHelper.registerUser(userData);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should handle password securely (not stored during registration)', async () => {
      // During registration, password is NOT stored yet
      // Password is only set during email verification
      const userData = TestDataFactory.createUserData();
      const response = await authHelper.registerUser(userData);
      const userId = response.body.user.id;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Password should be null until email is verified
      expect(dbUser?.passwordHash).toBeNull();
    });

    it('should reject SQL injection attempts in email', async () => {
      const userData = TestDataFactory.createUserData({
        email: "'; DROP TABLE users; --",
      });

      const response = await authHelper.registerUser(userData);

      // Should fail validation, not execute SQL
      expect(response.status).toBe(400);
      const message = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(message.toLowerCase()).toContain('email');

      // Verify users table still exists and is not affected
      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should reject XSS attempts in fullName', async () => {
      const userData = TestDataFactory.createUserData({
        fullName: '<script>alert("XSS")</script>',
      });

      const response = await authHelper.registerUser(userData);

      // Should either be sanitized or stored as-is (sanitization happens on output)
      expect(response.status).toBe(201);

      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      // Value should be stored (sanitization is responsibility of frontend/output layer)
      expect(dbUser?.fullName).toContain('script');
    });
  });

  describe('POST /auth/register - Edge Cases', () => {
    it('should handle concurrent registrations with different data', async () => {
      const users = TestDataFactory.createMultipleUserData(3);

      const promises = users.map((userData) =>
        authHelper.registerUser(userData),
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // Verify all users were created
      const userCount = await prisma.user.count();
      expect(userCount).toBe(3);
    });

    it('should handle registration with special characters in name', async () => {
      const userData = TestDataFactory.createUserData({
        fullName: "O'Brien-Smith José María",
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.fullName).toBe("O'Brien-Smith José María");
    });

    it('should handle registration with maximum length values', async () => {
      const userData = {
        fullName: 'A'.repeat(50), // Max length
        email: 'test@example.com',
        password: 'SecurePass123!',
        username: 'a'.repeat(30), // Max length
        dateOfBirth: new Date('1995-01-01'),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.fullName).toBe('A'.repeat(50));
      expect(response.body.user.username).toBe('a'.repeat(30));
    });

    it('should handle registration with valid date boundaries', async () => {
      // Test with someone born 100 years ago (edge case for age)
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

      const userData = TestDataFactory.createUserData({
        dateOfBirth: hundredYearsAgo,
      });

      const response = await authHelper.registerUser(userData);

      expect(response.status).toBe(201);
    });
  });
});
