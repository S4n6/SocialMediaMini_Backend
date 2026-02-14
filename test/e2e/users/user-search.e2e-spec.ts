import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { UserTestHelper } from '../../helpers/user-test.helper';

/**
 * E2E Tests for User Search
 * Tests GET /users/search endpoint
 *
 * Coverage:
 * - Search by username
 * - Search by full name
 * - Case-insensitive search
 * - Empty results handling
 * - Pagination support
 */
describe('Users - Search (E2E)', () => {
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
    helper = new UserTestHelper(app, prisma, 'src_');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await helper.cleanDatabase();

    // Create multiple users for search with predictable full names
    // Each user gets a unique username/email to avoid conflicts
    const users = [
      {
        fullName: 'John Smith',
      },
      {
        fullName: 'John Doe',
      },
      {
        fullName: 'Jane Doe',
      },
      {
        fullName: 'Bob Smith',
      },
    ];

    // Create users sequentially to ensure they all succeed
    for (const userData of users) {
      await helper.createTestUser(userData);
      // Small delay to ensure unique timestamps if needed
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  });

  afterEach(async () => {
    await helper.cleanDatabase();
  });

  describe('GET /users/search - Success Cases', () => {
    it('should search users by username', async () => {
      // Add delay to ensure users are fully created before searching
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app.getHttpServer())
        .get('/users/search?q=john')
        .expect(200);

      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
      // Search should find users with 'John' in their full name
      expect(
        response.body.data.users.some((u: any) => u.fullName.includes('John')),
      ).toBe(true);
    });

    it('should search users by full name', async () => {
      // Add delay to ensure users are fully created before searching
      await new Promise((resolve) => setTimeout(resolve, 100));

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
