import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository as AuthIUserRepository } from '../../domain/repositories/user.repository';
import { User as AuthUser } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

// Import Users module dependencies
import { UserPrismaRepository } from '../../../users/infrastructure/user.prisma.repository';
import { User as UsersUser } from '../../../users/domain/entities/user.entity';
import {
  UserId,
  UserEmail,
  Username,
} from '../../../users/domain/value-objects';
import { UserProfile } from '../../../users/domain/value-objects/user-profile.value-object';

/**
 * Auth User Repository Adapter
 * Adapts Users module repository to Auth domain interface
 * Follows Clean Architecture principles with proper domain mapping
 */
@Injectable()
export class AuthUserRepository implements AuthIUserRepository {
  constructor(
    @Inject('USERS_REPOSITORY_TOKEN')
    private readonly usersRepository: UserPrismaRepository,
  ) {}
  async create(user: AuthUser): Promise<AuthUser> {
    // Map Auth User to Users Domain User
    const usersUser = this.mapAuthUserToUsersUser(user);

    // Save using Users repository
    await this.usersRepository.save(usersUser);

    // Return the created user (Auth domain entity)
    return user;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const usersUser = await this.usersRepository.findById(new UserId(id));
    return usersUser ? this.mapUsersUserToAuthUser(usersUser) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const usersUser = await this.usersRepository.findByEmail(
      new UserEmail(email),
    );
    return usersUser ? this.mapUsersUserToAuthUser(usersUser) : null;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const usersUser = await this.usersRepository.findByGoogleId(googleId);
    return usersUser ? this.mapUsersUserToAuthUser(usersUser) : null;
  }

  async update(id: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    throw new Error(
      'Auth User Repository update method not yet implemented - will integrate with Users module',
    );
  }

  async delete(id: string): Promise<void> {
    throw new Error(
      'Auth User Repository delete method not yet implemented - will integrate with Users module',
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    throw new Error(
      'Auth User Repository existsByEmail method not yet implemented - will integrate with Users module',
    );
  }

  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
  ): Promise<void> {
    throw new Error(
      'Auth User Repository updateVerificationStatus method not yet implemented - will integrate with Users module',
    );
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await this.usersRepository.findById(new UserId(id));
    if (!user) {
      throw new Error('User not found');
    }

    user.updatePassword(hashedPassword);
    await this.usersRepository.save(user);
  }

  /**
   * Map Auth User to Users User for persistence
   */
  private mapAuthUserToUsersUser(authUser: AuthUser): UsersUser {
    // Create Users domain profile from Auth user data
    const profile = new UserProfile({
      fullName: authUser.fullName,
      bio: undefined, // Not available in Auth user
      avatar: authUser.avatar || undefined,
      location: undefined, // Not available in Auth user
      websiteUrl: undefined, // Not available in Auth user
      dateOfBirth: undefined, // Not available in Auth user
      phoneNumber: undefined, // Not available in Auth user
      gender: undefined, // Not available in Auth user
      lastProfileUpdate: undefined, // Not available in Auth user
    });

    // Create Users domain user
    return new UsersUser(
      authUser.id,
      authUser.username,
      authUser.email.value,
      profile,
      {
        passwordHash: authUser.hashedPassword,
        role: authUser.role as any, // Map role enum
        isEmailVerified: authUser.isEmailVerified,
        emailVerifiedAt: authUser.emailVerifiedAt || undefined,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      },
    );
  }

  /**
   * Map Users User to Auth User for Auth domain use
   */
  private mapUsersUserToAuthUser(usersUser: UsersUser): AuthUser {
    return AuthUser.fromPersistence({
      id: usersUser.id,
      email: new Email(usersUser.email),
      username: usersUser.username,
      fullName: usersUser.profile.fullName, // Use fullName property
      hashedPassword: usersUser.passwordHash || '',
      role: usersUser.role as any, // Map role enum
      isEmailVerified: usersUser.isEmailVerified,
      emailVerifiedAt: usersUser.emailVerifiedAt || null, // Convert undefined to null
      avatar: usersUser.profile.avatar || null,
      createdAt: usersUser.createdAt,
      updatedAt: usersUser.updatedAt,
      lastLoginAt: null, // Auth specific field not in Users domain
    });
  }
}
