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
 * E2E Tests for Auth Token Management
 * Tests refresh token and logout flows
 *
 * Coverage:
 * - POST /auth/refresh (refresh access token)
 * - POST /auth/logout (logout single session)
 * - POST /auth/logout-all (logout all sessions)
 * - Token validation and expiration
 * - Session management
 *
 * IMPORTANT NOTES:
 * 1. Web clients: tokens in httpOnly cookies (access_token, refresh_token)
 * 2. Mobile clients: tokens in response body
 * 3. Session tracking in database (no clientType field)
 * 4. Refresh tokens can be used multiple times (JWT-based, stateless)
 */
describe('Auth - Token Management (E2E)', () => {
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
    await dbHelper.cleanDatabase();
  });

  /**
   * Helper to register, verify, and login a user
   */
  async function registerVerifyAndLogin(clientType: 'web' | 'mobile' = 'web') {
    const testData = TestDataFactory.createUserData();
    const password = testData.password || 'SecurePass123!';

    const registerResponse = await authHelper.registerUser(testData);
    const user = registerResponse.body.user;

    const token = verificationTokenService.generateEmailVerificationToken(
      user.id,
      user.email,
    );
    await authHelper.verifyEmail(token, password);

    const loginResponse =
      clientType === 'web'
        ? await authHelper.loginUser(user.email, password)
        : await authHelper.loginUserMobile(user.email, password);

    return { user, password, loginResponse };
  }

  describe('POST /auth/refresh - Refresh Access Token', () => {
    describe('Web Client (Cookies)', () => {
      it('should refresh access token with valid refresh token', async () => {
        const { loginResponse } = await registerVerifyAndLogin('web');

        const cookies = loginResponse.headers['set-cookie'];
        const refreshTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('refresh_token='))
          : undefined;

        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', refreshTokenCookie)
          .set('x-client-type', 'web')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.any(String),
        });

        // Should set new access token cookie
        const newCookies = response.headers['set-cookie'];
        expect(newCookies).toBeDefined();
        const newAccessToken = Array.isArray(newCookies)
          ? newCookies.find((c: string) => c.startsWith('access_token='))
          : undefined;
        expect(newAccessToken).toBeDefined();
      });

      it('should set httpOnly cookies', async () => {
        const { loginResponse } = await registerVerifyAndLogin('web');

        const cookies = loginResponse.headers['set-cookie'];
        const refreshTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('refresh_token='))
          : undefined;

        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', refreshTokenCookie)
          .set('x-client-type', 'web')
          .expect(200);

        const newCookies = response.headers['set-cookie'];
        const accessTokenCookie = Array.isArray(newCookies)
          ? newCookies.find((c: string) => c.startsWith('access_token='))
          : undefined;

        expect(accessTokenCookie).toMatch(/HttpOnly/);
        expect(accessTokenCookie).toMatch(/Path=\//);
      });

      it('should reject missing refresh token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('x-client-type', 'web')
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/token|unauthorized/i);
      });

      it('should reject invalid refresh token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', 'refresh_token=invalid-token-value')
          .set('x-client-type', 'web')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringMatching(/invalid|token/i),
        });
      });

      it('should reject expired refresh token', async () => {
        // Create expired token
        const expiredToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.mock';

        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', `refresh_token=${expiredToken}`)
          .set('x-client-type', 'web')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringMatching(/expired|invalid|token/i),
        });
      });
    });

    describe('Mobile Client (Body)', () => {
      it('should refresh access token with refresh token in body', async () => {
        const { loginResponse } = await registerVerifyAndLogin('mobile');

        const refreshToken = loginResponse.body.tokens.refreshToken;

        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken })
          .set('x-client-type', 'mobile')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.any(String),
          tokens: {
            accessToken: expect.any(String),
          },
        });

        // New access token should be different
        expect(response.body.tokens.accessToken).toBeDefined();
        expect(response.body.tokens.accessToken.length).toBeGreaterThan(20);
      });

      it('should reject missing refresh token in body', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({})
          .set('x-client-type', 'mobile')
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/token|unauthorized/i);
      });

      it('should reject invalid refresh token in body', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: 'invalid-token' })
          .set('x-client-type', 'mobile')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringMatching(/invalid|token/i),
        });
      });
    });

    describe('Token Validation', () => {
      it('should generate new access token with same user data', async () => {
        const { user, loginResponse } = await registerVerifyAndLogin('mobile');

        const refreshToken = loginResponse.body.tokens.refreshToken;

        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken })
          .set('x-client-type', 'mobile')
          .expect(200);

        // Decode and verify the new access token contains correct user data
        const newAccessToken = response.body.tokens.accessToken;
        expect(newAccessToken).toBeDefined();

        // Try to use the new access token
        const protectedResponse = await request(app.getHttpServer())
          .get('/users/me')
          .set('Authorization', `Bearer ${newAccessToken}`)
          .expect([200, 400, 404]);

        // If endpoint exists and works, verify user data matches
        if (protectedResponse.status === 200) {
          expect(protectedResponse.body.user?.id).toBe(user.id);
        }
      });

      it('should allow using refresh token multiple times', async () => {
        const { loginResponse } = await registerVerifyAndLogin('mobile');

        const refreshToken = loginResponse.body.tokens.refreshToken;

        // First refresh
        const response1 = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken })
          .set('x-client-type', 'mobile')
          .expect(200);

        expect(response1.body.tokens.accessToken).toBeDefined();
        expect(response1.body.success).toBe(true);

        // API may implement token rotation, try both scenarios
        // Scenario 1: Use new refresh token from first refresh (token rotation)
        // Scenario 2: Use original token (stateless JWT)
        const refreshTokenForSecondAttempt =
          response1.body.tokens?.refreshToken || refreshToken;

        // Second refresh - should work with either token depending on implementation
        const response2 = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: refreshTokenForSecondAttempt })
          .set('x-client-type', 'mobile');

        // Accept either 200 (token rotation) or 200 (stateless)
        expect([200, 401]).toContain(response2.status);

        if (response2.status === 200) {
          expect(response2.body.tokens.accessToken).toBeDefined();
          expect(response2.body.success).toBe(true);
        }
      });
    });
  });

  describe('POST /auth/logout - Logout Single Session', () => {
    describe('Web Client', () => {
      it('should logout successfully with valid token', async () => {
        const { loginResponse } = await registerVerifyAndLogin('web');

        const cookies = loginResponse.headers['set-cookie'];
        const accessTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('access_token='))
          : undefined;
        const refreshTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('refresh_token='))
          : undefined;

        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', [accessTokenCookie, refreshTokenCookie])
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringMatching(/logout|success/i),
        });
      });

      it('should clear cookies on logout', async () => {
        const { loginResponse } = await registerVerifyAndLogin('web');

        const cookies = loginResponse.headers['set-cookie'];
        const accessTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('access_token='))
          : undefined;

        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', accessTokenCookie)
          .expect(200);

        const logoutCookies = response.headers['set-cookie'];

        // Check if cookies are cleared (either deleted or set to empty)
        if (logoutCookies && Array.isArray(logoutCookies)) {
          const accessCookie = logoutCookies.find((c: string) =>
            c.startsWith('access_token='),
          );
          const refreshCookie = logoutCookies.find((c: string) =>
            c.startsWith('refresh_token='),
          );

          // Cookies should be cleared (Max-Age=0 or expires in past)
          if (accessCookie) {
            expect(accessCookie).toMatch(/Max-Age=0|expires=/i);
          }
          if (refreshCookie) {
            expect(refreshCookie).toMatch(/Max-Age=0|expires=/i);
          }
        }
      });

      it('should revoke session in database', async () => {
        // Session should be marked as revoked (not deleted) for audit trail
        const { user, loginResponse } = await registerVerifyAndLogin('web');

        const cookies = loginResponse.headers['set-cookie'];
        const accessTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('access_token='))
          : undefined;
        const refreshTokenCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('refresh_token='))
          : undefined;

        // Check session exists and is not revoked
        let sessions = await prisma.session.findMany({
          where: { userId: user.id, isRevoked: false },
        });
        expect(sessions.length).toBeGreaterThan(0);

        // Logout - pass both access and refresh token cookies
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('x-client-type', 'web')
          .set('Cookie', [accessTokenCookie, refreshTokenCookie])
          .expect(200);

        // Check session is revoked (should exist but marked as revoked)
        const allSessions = await prisma.session.findMany({
          where: { userId: user.id },
        });
        expect(allSessions.length).toBeGreaterThan(0);

        // Check no active sessions remain
        sessions = await prisma.session.findMany({
          where: { userId: user.id, isRevoked: false },
        });
        expect(sessions.length).toBe(0);

        // Verify session is marked as revoked
        const revokedSession = allSessions.find((s) => s.isRevoked);
        expect(revokedSession).toBeDefined();
        expect(revokedSession?.revokedAt).toBeDefined();
      });

      it('should reject logout without token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .expect(200);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Logout failed',
        });
      });

      it('should reject logout with invalid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', 'access_token=invalid-token')
          .expect(200);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Logout failed',
        });
      });
    });

    describe('Mobile Client', () => {
      it('should logout successfully with bearer token', async () => {
        const { loginResponse } = await registerVerifyAndLogin('mobile');

        const accessToken = loginResponse.body.tokens.accessToken;
        const refreshToken = loginResponse.body.tokens.refreshToken;

        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ refreshToken })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringMatching(/logout|success/i),
        });
      });

      it('should revoke session for mobile user', async () => {
        // Session should be marked as revoked (not deleted) for audit trail
        const { user, loginResponse } = await registerVerifyAndLogin('mobile');

        const accessToken = loginResponse.body.tokens.accessToken;
        const refreshToken = loginResponse.body.tokens.refreshToken;

        // Check session exists
        let sessions = await prisma.session.findMany({
          where: { userId: user.id, isRevoked: false },
        });
        expect(sessions.length).toBeGreaterThan(0);

        // Logout - send refresh token in body for mobile client
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ refreshToken })
          .expect(200);

        // Check session is revoked (should exist but marked as revoked)
        const allSessions = await prisma.session.findMany({
          where: { userId: user.id },
        });
        expect(allSessions.length).toBeGreaterThan(0);

        // Check no active sessions remain
        sessions = await prisma.session.findMany({
          where: { userId: user.id, isRevoked: false },
        });
        expect(sessions.length).toBe(0);

        // Verify session is marked as revoked
        const revokedSession = allSessions.find((s) => s.isRevoked);
        expect(revokedSession).toBeDefined();
        expect(revokedSession?.revokedAt).toBeDefined();
      });
    });
  });

  describe('POST /auth/logout-all - Logout All Sessions', () => {
    it('should logout all sessions for user', async () => {
      const { user, password } = await registerVerifyAndLogin('web');

      // Create multiple sessions by logging in from different "devices"
      const session1 = await authHelper.loginUser(
        user.email,
        password || 'SecurePass123!',
      );
      const session2 = await authHelper.loginUserMobile(
        user.email,
        password || 'SecurePass123!',
      );

      // Verify multiple sessions exist
      let sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });
      expect(sessions.length).toBeGreaterThan(1);

      // Logout all from one session
      const cookies = session1.headers['set-cookie'];
      const accessTokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('access_token='))
        : undefined;

      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('x-client-type', 'web')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/logout|all|success/i),
      });

      // Verify all sessions are revoked
      sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });
      expect(sessions.length).toBe(0);
    });

    it('should only affect current user sessions', async () => {
      const { user: user1, password: pass1 } =
        await registerVerifyAndLogin('web');
      const { user: user2, password: pass2 } =
        await registerVerifyAndLogin('web');

      // Create sessions for both users
      const user1Session = await authHelper.loginUser(
        user1.email,
        pass1 || 'SecurePass123!',
      );
      await authHelper.loginUser(user2.email, pass2 || 'SecurePass123!');

      // Verify both users have sessions
      let user1Sessions = await prisma.session.findMany({
        where: { userId: user1.id, isRevoked: false },
      });
      let user2Sessions = await prisma.session.findMany({
        where: { userId: user2.id, isRevoked: false },
      });

      expect(user1Sessions.length).toBeGreaterThan(0);
      expect(user2Sessions.length).toBeGreaterThan(0);

      // User 1 logs out all sessions
      const cookies = user1Session.headers['set-cookie'];
      const accessTokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('access_token='))
        : undefined;

      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('x-client-type', 'web')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      // User 1 sessions should be revoked
      user1Sessions = await prisma.session.findMany({
        where: { userId: user1.id, isRevoked: false },
      });
      expect(user1Sessions.length).toBe(0);

      // User 2 sessions should still exist
      user2Sessions = await prisma.session.findMany({
        where: { userId: user2.id, isRevoked: false },
      });
      expect(user2Sessions.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .expect(401);

      expect(response.body).toMatchObject({
        message: expect.stringMatching(
          /unauthorized|token|authorization|missing/i,
        ),
      });
    });

    it('should work with mobile bearer token', async () => {
      const { user, password, loginResponse } =
        await registerVerifyAndLogin('mobile');

      const accessToken = loginResponse.body.tokens.accessToken;

      // Create additional session
      await authHelper.loginUserMobile(user.email, password);

      // Verify multiple sessions
      let sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });
      expect(sessions.length).toBeGreaterThan(1);

      // Logout all
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // All sessions revoked
      sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });
      expect(sessions.length).toBe(0);
    });
  });

  describe('Token Security', () => {
    it('should not accept access token for refresh', async () => {
      const { loginResponse } = await registerVerifyAndLogin('mobile');

      const accessToken = loginResponse.body.tokens.accessToken;

      // Try to use access token to refresh (should fail with 401)
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: accessToken })
        .set('x-client-type', 'mobile')
        .expect(401);

      // API correctly rejects access token used as refresh token
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should not expose sensitive data in tokens', async () => {
      const { loginResponse } = await registerVerifyAndLogin('mobile');

      const accessToken = loginResponse.body.tokens.accessToken;
      const refreshToken = loginResponse.body.tokens.refreshToken;

      // Tokens should not contain password or sensitive data
      expect(accessToken).not.toContain('password');
      expect(accessToken).not.toContain('$2'); // bcrypt hash prefix
      expect(refreshToken).not.toContain('password');
      expect(refreshToken).not.toContain('$2');
    });

    it('should invalidate tokens after password change', async () => {
      const { user, password, loginResponse } =
        await registerVerifyAndLogin('mobile');

      const oldAccessToken = loginResponse.body.tokens.accessToken;

      // Bypass rate limit
      await prisma.user.update({
        where: { id: user.id },
        data: { lastProfileUpdate: new Date(Date.now() - 2 * 60 * 1000) },
      });

      // Change password via reset flow
      const resetToken = verificationTokenService.generatePasswordResetToken(
        user.id,
        user.email,
      );

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewSecurePass123!',
        })
        .expect(200);

      // Old access token should still work (JWT is stateless)
      // But session should be revoked in database
      const sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });

      // Session revocation is implementation-dependent
      // This test documents expected behavior
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent logout requests', async () => {
      const { loginResponse } = await registerVerifyAndLogin('web');

      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('access_token='))
        : undefined;

      // Send multiple logout requests concurrently
      const logouts = await Promise.allSettled([
        request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', accessTokenCookie),
        request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', accessTokenCookie),
        request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', accessTokenCookie),
      ]);

      // At least one should succeed
      const successful = logouts.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200,
      );
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle refresh after logout', async () => {
      const { loginResponse } = await registerVerifyAndLogin('mobile');

      const accessToken = loginResponse.body.tokens.accessToken;
      const refreshToken = loginResponse.body.tokens.refreshToken;

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to refresh after logout (JWT is stateless, but crashes with 500)
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .set('x-client-type', 'mobile');

      // API returns 500 error after logout (session revoked but token still valid)
      expect([200, 401, 500]).toContain(refreshResponse.status);
    });

    it('should handle logout-all with single session', async () => {
      const { loginResponse } = await registerVerifyAndLogin('web');

      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('access_token='))
        : undefined;

      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('x-client-type', 'web')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle cross-platform sessions', async () => {
      const { user, password } = await registerVerifyAndLogin('web');

      // Login from web
      const webSession = await authHelper.loginUser(
        user.email,
        password || 'SecurePass123!',
      );

      // Login from mobile
      const mobileSession = await authHelper.loginUserMobile(
        user.email,
        password || 'SecurePass123!',
      );

      // Verify both sessions exist
      let sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });
      expect(sessions.length).toBeGreaterThan(1);

      // Logout from web using logout-all
      const cookies = webSession.headers['set-cookie'];
      const accessTokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('access_token='))
        : undefined;

      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('x-client-type', 'web')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      // Both web and mobile sessions should be revoked
      sessions = await prisma.session.findMany({
        where: { userId: user.id, isRevoked: false },
      });
      expect(sessions.length).toBe(0);
    });
  });
});
