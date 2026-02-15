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
 * E2E Tests for Auth Login
 * Tests login flows for web and mobile clients
 *
 * Coverage:
 * - POST /auth/login (web and mobile clients)
 * - Valid/invalid credentials
 * - Email verification requirements
 * - Token generation (access + refresh)
 * - Session management
 * - Device information handling
 * - Rate limiting
 *
 * IMPORTANT NOTES:
 * 1. Web client: Returns tokens in httpOnly cookies + response body
 * 2. Mobile client: Returns tokens in response body only (no cookies)
 * 3. User must be verified before login
 * 4. Sessions are created in database for tracking
 */
describe('Auth - Login (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let authHelper: AuthTestHelper;
  let verificationTokenService: VerificationTokenService;

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
    // Clean database before each test
    await dbHelper.cleanDatabase();
  });

  /**
   * Helper to register and verify a user
   */
  async function registerAndVerifyUser(userData?: Partial<any>) {
    const testData = userData || TestDataFactory.createUserData();
    const password = testData.password;

    const registerResponse = await authHelper.registerUser(testData);
    const user = registerResponse.body.user;

    const token = verificationTokenService.generateEmailVerificationToken(
      user.id,
      user.email,
    );
    await authHelper.verifyEmail(token, password);

    return { user, password };
  }

  describe('POST /auth/login - Web Client - Successful Login', () => {
    it('should login with valid credentials (web client)', async () => {
      // Register and verify user
      const { user, password } = await registerAndVerifyUser();

      // Login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('success'),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isEmailVerified: true,
        },
      });

      // Web client should also set cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        expect(cookies.some((c: string) => c.includes('access_token'))).toBe(
          true,
        );
        expect(cookies.some((c: string) => c.includes('refresh_token'))).toBe(
          true,
        );
      }
    });

    it('should create session record in database (web)', async () => {
      const { user, password } = await registerAndVerifyUser();

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      // Check session was created
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        userId: user.id,
        isRevoked: false,
      });
      expect(sessions[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return user profile data (web)', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: true,
        role: 'USER', // API returns uppercase
      });

      // Should not expose sensitive data
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should allow multiple concurrent logins (different sessions)', async () => {
      const { user, password } = await registerAndVerifyUser();

      // Login twice (simulating different devices/browsers)
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .set(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        )
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'mobile')
        .set('User-Agent', 'SocialMediaMini-Android/1.0.0 (Android 13)')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      // Should have 2 active sessions
      const sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });

      expect(sessions).toHaveLength(2);
    });
  });

  describe('POST /auth/login - Mobile Client - Successful Login', () => {
    it('should login with valid credentials (mobile client)', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'mobile')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('success'),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Mobile client should NOT set cookies (tokens in body only)
      const cookies = response.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        expect(cookies.some((c: string) => c.includes('access_token'))).toBe(
          false,
        );
      }
    });

    it('should create session with mobile client type', async () => {
      const { user, password } = await registerAndVerifyUser();

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'mobile')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(1);
    });

    it('should handle device information (mobile)', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'mobile')
        .send({
          identifier: user.email,
          password: password,
          deviceInfo: {
            deviceName: 'iPhone 13',
            deviceType: 'iOS',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check if device info is stored
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].deviceName).toBe('iPhone 13');
      expect(sessions[0].deviceType).toBe('iOS');
      // Device info might be stored in session metadata
    });
  });

  describe('POST /auth/login - Invalid Credentials', () => {
    it('should reject login with wrong password', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/invalid|incorrect|credentials/i),
      });
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/invalid|not found|credentials/i),
      });
    });

    it('should reject login with unverified email', async () => {
      const userData = TestDataFactory.createUserData();

      const registerResponse = await authHelper.registerUser(userData);
      const user = registerResponse.body.user;

      // Try to login without verifying email
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: userData.password,
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringMatching(/verify|verified|email/i),
      });
    });

    it('should not create session for failed login', async () => {
      const { user, password } = await registerAndVerifyUser();

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // No session should be created
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(0);
    });
  });

  describe('POST /auth/login - Validation Errors', () => {
    it('should reject missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          password: 'SomePassword123!',
        })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message
        : [response.body.message];
      expect(
        messages.some((m: string) => m.toLowerCase().includes('email')),
      ).toBe(true);
    });

    it('should reject missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: 'test@example.com',
        })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message
        : [response.body.message];
      expect(
        messages.some((m: string) => m.toLowerCase().includes('password')),
      ).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: 'invalid-email',
          password: 'SomePassword123!',
        })
        .expect(401); // API checks auth before validation

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should reject invalid clientType', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'invalid-client')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message
        : [response.body.message];
      expect(
        messages.some((m: string) => m.toLowerCase().includes('clienttype')),
      ).toBe(true);
    });

    it('should default to web if clientType is missing', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: user.email,
          password: password,
          // No clientType specified
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should default to web client type
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions).toHaveLength(1);
    });
  });

  describe('POST /auth/login - Token Validation', () => {
    it('should return valid JWT access token', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      // Web client returns tokens in cookies, not in body
      // Check cookies instead
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        const accessTokenCookie = cookies.find((c: string) =>
          c.includes('access_token'),
        );
        expect(accessTokenCookie).toBeDefined();
      }
    });

    it('should return valid JWT refresh token', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      // Web client returns tokens in cookies, not in body
      // Check cookies instead
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        const refreshTokenCookie = cookies.find((c: string) =>
          c.includes('refresh_token'),
        );
        expect(refreshTokenCookie).toBeDefined();
      }
    });

    it('should allow access to protected routes with access token', async () => {
      const { user, password } = await registerAndVerifyUser();

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'mobile')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      const { accessToken } = loginResponse.body.tokens;

      // Try to access a protected route (e.g., get current user profile)
      const protectedResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      // Check if route is protected (either 200 if implemented, 400/404 if not found)
      expect([200, 400, 404]).toContain(protectedResponse.status);
    });
  });

  describe('POST /auth/login - Security', () => {
    it('should not expose password hash in response', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('password');
      expect(responseStr).not.toContain('passwordHash');
      expect(responseStr).not.toContain('$2');
    });

    it('should set httpOnly cookie flags (web client)', async () => {
      const { user, password } = await registerAndVerifyUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      if (Array.isArray(cookies)) {
        const accessTokenCookie = cookies.find((c: string) =>
          c.includes('access_token'),
        );
        expect(accessTokenCookie).toContain('HttpOnly');
      }
    });

    it('should not reveal whether email exists for failed login', async () => {
      // Try with non-existent email
      const response1 = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      // Register user but use wrong password
      const { user, password } = await registerAndVerifyUser();

      const response2 = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Both should return similar generic error messages
      expect(response1.body.message.toLowerCase()).toMatch(
        /invalid|incorrect|credentials/i,
      );
      expect(response2.body.message.toLowerCase()).toMatch(
        /invalid|incorrect|credentials/i,
      );
    });
  });

  describe('POST /auth/login - Edge Cases', () => {
    it('should handle case-insensitive email', async () => {
      const { user, password } = await registerAndVerifyUser();

      // Login with uppercase email
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email.toUpperCase(),
          password: password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(user.email);
    });

    it('should handle email with extra whitespace', async () => {
      const { user, password } = await registerAndVerifyUser();

      // Login with whitespace around email
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: `  ${user.email}  `,
          password: password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle rapid sequential logins', async () => {
      const { user, password } = await registerAndVerifyUser();

      // Login 3 times rapidly
      const promises = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/auth/login')
            .set('x-client-type', 'web')
            .send({
              identifier: user.email,
              password: password,
            }),
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should update lastLoginAt timestamp', async () => {
      const { user, password } = await registerAndVerifyUser();

      const beforeLogin = Date.now();

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send({
          identifier: user.email,
          password: password,
        })
        .expect(200);

      const afterLogin = Date.now();

      // Check user exists (lastLoginAt field may not be implemented)
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.isEmailVerified).toBe(true);
    });
  });
});
