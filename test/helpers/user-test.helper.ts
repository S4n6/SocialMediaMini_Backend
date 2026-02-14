import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import * as request from 'supertest';

/**
 * Helper class for User E2E Tests
 * Provides reusable test data, cleanup functions, and assertions
 */
export class UserTestHelper {
  private counter = 0;
  private suitePrefix: string;

  constructor(
    private app: INestApplication,
    private prisma: PrismaService,
    suitePrefix: string = '',
  ) {
    this.suitePrefix = suitePrefix;
  }

  /**
   * Generate unique identifier for test data
   * Keeps it short to fit username max length (30 chars)
   * Includes suite prefix for test isolation
   */
  private getUniqueId(): string {
    // Use last 6 digits of timestamp + counter + short random + prefix
    const shortTime = Date.now().toString().slice(-6);
    const shortRandom = Math.random().toString(36).substr(2, 5);
    // Prefix in middle to keep username starting with letter
    return `${shortTime}${this.suitePrefix}${this.counter++}${shortRandom}`;
  }

  /**
   * Clean user-related data from database
   * Only deletes users created by this test suite (scoped by prefix)
   * Respects foreign key constraints
   */
  async cleanDatabase() {
    if (this.suitePrefix) {
      // Scoped cleanup - delete users with username pattern: user{timestamp}{prefix}{counter}{random}
      await this.prisma.follow.deleteMany({
        where: {
          OR: [
            { follower: { username: { contains: this.suitePrefix } } },
            { following: { username: { contains: this.suitePrefix } } },
          ],
        },
      });

      await this.prisma.user.deleteMany({
        where: { username: { contains: this.suitePrefix } },
      });
    } else {
      // Fallback: delete all (for backward compatibility)
      await this.prisma.$transaction([
        this.prisma.follow.deleteMany(),
        this.prisma.user.deleteMany(),
      ]);
    }
    // Small delay to ensure database constraints are fully resolved
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Create a test user via API
   */
  async createTestUser(overrides?: Partial<CreateUserData>): Promise<any> {
    // Use the helper to generate data which includes password
    const userData = this.createUserData(overrides);

    const response = await request(this.app.getHttpServer())
      .post('/users')
      .send(userData)
      .expect(201);

    return response.body.data;
  }

  /**
   * Generate test user data
   */
  createUserData(overrides?: Partial<CreateUserData>): CreateUserData {
    const uniqueId = this.getUniqueId();
    return {
      username: `user${uniqueId}`, // Shorter prefix to stay under 30 chars
      email: `test${uniqueId}@example.com`,
      password: 'SecurePass123!',
      fullName: 'Test User',
      bio: 'Test bio',
      location: 'Test City',
      ...overrides,
    };
  }

  /**
   * Generate multiple unique test users data
   */
  createMultipleUsersData(count: number): CreateUserData[] {
    return Array.from({ length: count }, (_, i) => ({
      username: `testuser${Date.now()}_${i}`,
      email: `test${Date.now()}_${i}@example.com`,
      password: 'SecurePass123!',
      fullName: `Test User ${i + 1}`,
    }));
  }

  /**
   * Assert valid user response structure
   */
  expectValidUserResponse(user: any) {
    expect(user).toMatchObject({
      id: expect.any(String),
      username: expect.any(String),
      email: expect.any(String),
      fullName: expect.any(String),
      followersCount: expect.any(Number),
      followingCount: expect.any(Number),
    });

    // Sensitive fields should NOT be present
    expect(user.password).toBeUndefined();
    expect(user.passwordHash).toBeUndefined();
  }

  /**
   * Assert error response contains expected message
   */
  expectErrorMessage(response: any, expectedText: string) {
    const message = Array.isArray(response.body.message)
      ? response.body.message.join(' ').toLowerCase()
      : (response.body.message || '').toLowerCase();

    expect(message).toContain(expectedText.toLowerCase());
  }
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  bio?: string;
  location?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  avatar?: string;
}
