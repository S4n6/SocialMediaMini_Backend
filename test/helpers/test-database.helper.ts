import { PrismaService } from '../../src/database/prisma.service';

/**
 * Database helper for integration tests
 * Provides cleanup and data seeding utilities
 */
export class TestDatabaseHelper {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean all test data from database
   * Call this in afterEach or afterAll hooks
   */
  async cleanDatabase(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await this.prisma.story.deleteMany();
    await this.prisma.searchHistory.deleteMany();
    await this.prisma.session.deleteMany();
    await this.prisma.reaction.deleteMany();
    await this.prisma.comment.deleteMany();
    await this.prisma.post.deleteMany();
    await this.prisma.follow.deleteMany();
    await this.prisma.user.deleteMany();
  }

  /**
   * Clean only user-related data
   * Uses error handling to ensure cleanup continues even if some tables are empty
   */
  async cleanUserData(): Promise<void> {
    try {
      await this.prisma.follow.deleteMany();
    } catch (error) {
      // Ignore errors if table is empty or doesn't exist
    }
    try {
      await this.prisma.user.deleteMany();
    } catch (error) {
      // Ignore errors if table is empty or doesn't exist
    }
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    return this.prisma.user.count();
  }

  /**
   * Get follow relationship count
   */
  async getFollowCount(): Promise<number> {
    return this.prisma.follow.count();
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by id
   */
  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Check if follow relationship exists
   */
  async followExists(followerId: string, followeeId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followeeId,
        },
      },
    });
    return follow !== null;
  }

  /**
   * Get user's followers count
   */
  async getFollowersCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followingId: userId },
    });
  }

  /**
   * Get user's following count
   */
  async getFollowingCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followerId: userId },
    });
  }
}
