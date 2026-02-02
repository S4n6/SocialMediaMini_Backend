import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import {
  IUserRepository,
  User,
  UserFactory,
  UserId,
  UserEmail,
  Username,
  UserRole,
  UserStatus,
} from '../../../domain';

/**
 * Prisma implementation of UserRepository
 * Updated to work with new schema structure
 */
@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Helpers to safely coerce unknown Prisma results
  private asRecord(v: unknown): Record<string, unknown> {
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  }

  private safeString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      const json = JSON.stringify(v);
      return json === undefined ? Object.prototype.toString.call(v) : json;
    } catch {
      return Object.prototype.toString.call(v);
    }
  }

  private safeBool(v: unknown): boolean {
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
    return Boolean(v);
  }

  private safeDate(v: unknown): Date {
    if (v instanceof Date) return v;
    if (v === null || v === undefined) return new Date(); // Return current date for required fields
    const s = this.safeString(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // For optional date fields, return undefined if null/undefined
  private safeDateOrUndefined(v: unknown): Date | undefined {
    if (v === null || v === undefined) return undefined;
    if (v instanceof Date) return v;
    const s = this.safeString(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }

  private safeStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => this.safeString(x));
  }

  async save(user: User): Promise<void> {
    const userData = this.mapToDataModel(user);

    await this.prisma.user.upsert({
      where: { id: user.id },
      update: userData,
      create: userData,
    });
  }

  async findById(id: UserId | string): Promise<User | null> {
    const idValue = typeof id === 'string' ? id : id.getValue();
    const userData = await this.prisma.user.findUnique({
      where: { id: idValue },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findByEmail(email: UserEmail | string): Promise<User | null> {
    const emailValue = typeof email === 'string' ? email : email.getValue();

    if (!emailValue || emailValue.trim() === '') {
      console.warn(
        'UserPrismaRepository.findByEmail called with empty/undefined email:',
        email,
      );
      return null;
    }

    const userData = await this.prisma.user.findUnique({
      where: { email: emailValue },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findByUsername(username: Username | string): Promise<User | null> {
    const usernameValue =
      typeof username === 'string' ? username : username.getValue();
    const userData = await this.prisma.user.findUnique({
      where: { username: usernameValue }, // Updated to use 'username'
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { googleId },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async existsByEmail(email: UserEmail | string): Promise<boolean> {
    const emailValue = typeof email === 'string' ? email : email.getValue();
    const count = await this.prisma.user.count({
      where: { email: emailValue },
    });
    return count > 0;
  }

  async existsByUsername(username: Username | string): Promise<boolean> {
    const usernameValue =
      typeof username === 'string' ? username : username.getValue();
    const count = await this.prisma.user.count({
      where: { username: usernameValue }, // Updated to use 'username'
    });
    return count > 0;
  }

  async deleteById(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.getValue() },
    });
  }

  async findByIds(ids: UserId[]): Promise<User[]> {
    const userIds = ids.map((id) => id.getValue());
    const usersData = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    return usersData.map((userData) => this.mapToDomainModel(userData));
  }

  async searchUsers(
    query: string,
    page: number,
    limit: number,
  ): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    const whereCondition = {
      OR: [
        { username: { contains: query, mode: 'insensitive' as const } }, // Updated field name
        { fullName: { contains: query, mode: 'insensitive' as const } }, // Direct field access
      ],
    };

    const [usersData, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        include: {
          followers: { select: { followerId: true } },
          following: { select: { followingId: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);

    return {
      users: usersData.map((userData) => this.mapToDomainModel(userData)),
      total,
      hasMore: page * limit < total,
    };
  }

  private mapToDomainModel(userData: any): User {
    const row = this.asRecord(userData);

    const profile = {
      fullName: this.safeString(row.fullName) || 'Unknown User', // Ensure non-empty fullName
      bio: this.safeString(row.bio) || undefined,
      avatar: this.safeString(row.avatar) || undefined,
      location: this.safeString(row.location) || undefined,
      websiteUrl: this.safeString(row.websiteUrl) || undefined,
      dateOfBirth: this.safeDateOrUndefined(row.dateOfBirth), // Optional date
      phoneNumber: this.safeString(row.phoneNumber) || undefined,
      gender: this.safeString(row.gender) || undefined,
    };

    const following = Array.isArray(row.following)
      ? (row.following as unknown[]).map((f) =>
          this.safeString(this.asRecord(f).followingId),
        )
      : [];

    const followers = Array.isArray(row.followers)
      ? (row.followers as unknown[]).map((f) =>
          this.safeString(this.asRecord(f).followerId),
        )
      : [];

    // Map role/status strings into enums with safe defaults
    const roleStr = this.safeString(row.role);
    const role = (Object.values(UserRole) as string[]).includes(roleStr)
      ? (roleStr as UserRole)
      : UserRole.USER;

    const statusStr = this.safeString(row.status);
    const status = (Object.values(UserStatus) as string[]).includes(statusStr)
      ? (statusStr as UserStatus)
      : UserStatus.ACTIVE;

    return UserFactory.reconstructUser({
      id: this.safeString(row.id),
      username: this.safeString(row.username),
      email: this.safeString(row.email),
      passwordHash: this.safeString(row.passwordHash) || undefined,
      googleId: this.safeString(row.googleId) || undefined,
      role,
      status,
      isEmailVerified: this.safeBool(row.isEmailVerified),
      emailVerifiedAt: this.safeDateOrUndefined(row.emailVerifiedAt), // Optional
      createdAt: this.safeDate(row.createdAt),
      updatedAt: this.safeDate(row.updatedAt),
      lastProfileUpdate: this.safeDateOrUndefined(row.lastProfileUpdate), // Optional - CRITICAL FIX
      lastVerificationSentAt: this.safeDateOrUndefined(
        row.lastVerificationSentAt,
      ), // Optional
      profile,
      followingIds: following,
      followerIds: followers,
    });
  }

  // Missing methods implementation
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const userData = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findMultipleByIds(ids: string[]): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    return usersData.map((userData) => this.mapToDomainModel(userData));
  }

  private mapToDataModel(user: User): any {
    return {
      id: user.id,
      username: user.username, // Updated field name
      email: user.email,
      passwordHash: user.passwordHash, // Need to add getter in User entity
      googleId: user.googleId,
      role: user.role,
      status: user.status, // New field
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      updatedAt: user.updatedAt,
      // Profile fields are now direct on User model
      lastProfileUpdate: user.lastProfileUpdate,
      lastVerificationSentAt: user.lastVerificationSentAt,
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      location: user.profile.location,
      websiteUrl: user.profile.websiteUrl,
      dateOfBirth: user.profile.dateOfBirth,
      phoneNumber: user.profile.phoneNumber,
      gender: user.profile.gender,
    };
  }
}
