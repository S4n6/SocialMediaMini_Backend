import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * Auth Test Helper
 * Provides reusable utilities for auth E2E tests
 */
export class AuthTestHelper {
  constructor(
    private readonly app: INestApplication,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Register a new user
   * @returns response with user data
   */
  async registerUser(userData?: Partial<any>) {
    const defaultData = {
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'SecurePass123!', // Required during registration
      dateOfBirth: new Date('1995-01-01'),
      username: `testuser${Date.now()}`,
      gender: 'male',
      phoneNumber: '+12345678901', // 10 digits after country code
    };

    return request(this.app.getHttpServer())
      .post('/auth/register')
      .send({ ...defaultData, ...userData });
  }

  /**
   * Verify email with token and password
   * @returns response with verified user data
   */
  async verifyEmail(token: string, password: string) {
    return request(this.app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token, password });
  }

  /**
   * Login user (web client - returns cookies)
   * @returns response with user data and cookies
   */
  async loginUser(identifier: string, password: string, rememberMe = false) {
    return request(this.app.getHttpServer())
      .post('/auth/login')
      .set('x-client-type', 'web')
      .set(
        'User-Agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      )
      .send({ identifier, password, rememberMe });
  }

  /**
   * Login user (mobile client - returns tokens in body)
   * @returns response with user data and tokens
   */
  async loginUserMobile(
    identifier: string,
    password: string,
    rememberMe = false,
  ) {
    // Add unique identifier to User-Agent to allow multiple mobile sessions
    const uniqueId = Date.now() + Math.random().toString(36).substring(7);
    return request(this.app.getHttpServer())
      .post('/auth/login')
      .set('x-client-type', 'mobile')
      .set(
        'User-Agent',
        `SocialMediaMini-Android/1.0.0 (Android 13; Device ${uniqueId})`,
      )
      .send({ identifier, password, rememberMe });
  }

  /**
   * Refresh access token (web client - using cookies)
   * @returns response with new tokens in cookies
   */
  async refreshToken(refreshTokenCookie: string) {
    return request(this.app.getHttpServer())
      .post('/auth/refresh')
      .set('x-client-type', 'web')
      .set('Cookie', [`refresh_token=${refreshTokenCookie}`]);
  }

  /**
   * Refresh access token (mobile client - token in body)
   * @returns response with new tokens in body
   */
  async refreshTokenMobile(refreshToken: string) {
    return request(this.app.getHttpServer())
      .post('/auth/refresh')
      .set('x-client-type', 'mobile')
      .send({ refreshToken });
  }

  /**
   * Logout user (web client)
   */
  async logout(refreshTokenCookie?: string) {
    const req = request(this.app.getHttpServer())
      .post('/auth/logout')
      .set('x-client-type', 'web');

    if (refreshTokenCookie) {
      req.set('Cookie', [`refresh_token=${refreshTokenCookie}`]);
    }

    return req.send({});
  }

  /**
   * Logout user (mobile client)
   */
  async logoutMobile(refreshToken: string) {
    return request(this.app.getHttpServer())
      .post('/auth/logout')
      .set('x-client-type', 'mobile')
      .send({ refreshToken });
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string) {
    return request(this.app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    return request(this.app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token, newPassword });
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string) {
    return request(this.app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email });
  }

  /**
   * Extract access token from cookie header
   */
  extractAccessTokenFromCookie(response: any): string | null {
    const cookies = response.headers['set-cookie'];
    if (!cookies) return null;

    const accessTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('access_token='),
    );

    if (!accessTokenCookie) return null;

    const match = accessTokenCookie.match(/access_token=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract refresh token from cookie header
   */
  extractRefreshTokenFromCookie(response: any): string | null {
    const cookies = response.headers['set-cookie'];
    if (!cookies) return null;

    const refreshTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('refresh_token='),
    );

    if (!refreshTokenCookie) return null;

    const match = refreshTokenCookie.match(/refresh_token=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Register user and complete verification
   * Note: This currently requires mocking JWT service to get actual verification tokens
   * For now, this method will skip verification (return unverified user)
   * @returns { user, password, email, username }
   */
  async registerAndVerifyUser(userData?: Partial<any>) {
    const password = 'SecurePass123!';

    // 1. Register
    const registerResponse = await this.registerUser(userData);
    const user = registerResponse.body.user;

    // TODO: Add JWT token mocking to actually verify the email
    // For now, we'll need to manually verify users in database for tests that require it
    // or use a different approach

    return {
      user,
      password,
      email: user.email,
      username: user.username,
    };
  }

  /**
   * Register, verify, and login user
   * @returns { user, tokens, password, accessToken, refreshToken }
   */
  async createAuthenticatedUser(
    userData?: Partial<any>,
    clientType: 'web' | 'mobile' = 'web',
  ) {
    // Note: registerAndVerifyUser may not work as verification requires actual JWT tokens
    // This method is kept for future implementation when JWT mocking is added
    const { user, password, email } =
      await this.registerAndVerifyUser(userData);

    // Login
    let loginResponse;
    if (clientType === 'web') {
      loginResponse = await this.loginUser(email, password);
      const accessToken = this.extractAccessTokenFromCookie(loginResponse);
      const refreshToken = this.extractRefreshTokenFromCookie(loginResponse);

      return {
        user: loginResponse.body.user,
        password,
        email,
        accessToken,
        refreshToken,
      };
    } else {
      loginResponse = await this.loginUserMobile(email, password);
      return {
        user: loginResponse.body.user,
        password,
        email,
        accessToken: loginResponse.body.tokens.accessToken,
        refreshToken: loginResponse.body.tokens.refreshToken,
      };
    }
  }

  /**
   * Generate mock verification token for testing
   * Note: In production, these are JWT tokens generated by VerificationTokenService
   * For E2E tests, we'll need to mock or generate actual JWTs
   */
  generateMockVerificationToken(userId: string, email: string): string {
    // For now, return a mock token
    // In real implementation, this would use JwtService to generate actual JWT
    return `mock-verification-token-${userId}`;
  }

  /**
   * Generate mock password reset token for testing
   */
  generateMockPasswordResetToken(userId: string, email: string): string {
    return `mock-reset-token-${userId}`;
  }

  /**
   * Check if session exists for user
   */
  async sessionExists(userId: string): Promise<boolean> {
    const count = await this.prisma.session.count({
      where: { userId },
    });

    return count > 0;
  }

  /**
   * Get active sessions count for user
   */
  async getActiveSessionsCount(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }
}
