import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository as AuthIUserRepository } from '../../domain/repositories/user.repository';
import {
  User as AuthUser,
  UserRole as AuthUserRole,
} from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

// Import Users module dependencies
import { UserPrismaRepository } from '../../../users/infrastructure/persistence/repositories/user.repository';
import {
  User as UsersUser,
  UserRole as UsersUserRole,
} from '../../../users/domain/entities/user.entity';
import { UserId, UserEmail } from '../../../users/domain/value-objects';
import { UserProfile } from '../../../users/domain/value-objects/user-profile.value-object';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';

/**
 * Role mapping between Auth and Users bounded contexts.
 * Both enums have identical string values (USER, ADMIN, MODERATOR),
 * but are separate types to respect domain boundaries.
 */
const AUTH_TO_USERS_ROLE: Record<AuthUserRole, UsersUserRole> = {
  [AuthUserRole.USER]: UsersUserRole.USER,
  [AuthUserRole.ADMIN]: UsersUserRole.ADMIN,
  [AuthUserRole.MODERATOR]: UsersUserRole.MODERATOR,
};

const USERS_TO_AUTH_ROLE: Record<UsersUserRole, AuthUserRole> = {
  [UsersUserRole.USER]: AuthUserRole.USER,
  [UsersUserRole.ADMIN]: AuthUserRole.ADMIN,
  [UsersUserRole.MODERATOR]: AuthUserRole.MODERATOR,
};

/**
 * Auth User Repository Adapter
 * Adapts Users module repository to Auth domain interface.
 * Follows Clean Architecture: Auth domain never touches Users persistence directly.
 */
@Injectable()
export class AuthUserRepository implements AuthIUserRepository {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly usersRepository: UserPrismaRepository,
  ) {}

  async create(user: AuthUser): Promise<AuthUser> {
    const usersUser = this.mapAuthUserToUsersUser(user);
    await this.usersRepository.save(usersUser);
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
    // Load current user, apply partial changes, and save
    const usersUser = await this.usersRepository.findById(new UserId(id));
    if (!usersUser) {
      throw new Error(`User with id '${id}' not found`);
    }

    // For now, delegate to save — Auth domain mutations (verifyEmail, changePassword)
    // should use dedicated methods below, not generic update.
    await this.usersRepository.save(usersUser);
    return this.mapUsersUserToAuthUser(usersUser);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.existsByEmail(email);
  }

  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
  ): Promise<void> {
    const usersUser = await this.usersRepository.findById(new UserId(id));
    if (!usersUser) {
      throw new Error(`User with id '${id}' not found`);
    }

    if (isVerified) {
      usersUser.verifyEmail();
    }
    await this.usersRepository.save(usersUser);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const usersUser = await this.usersRepository.findById(new UserId(id));
    if (!usersUser) {
      throw new Error(`User with id '${id}' not found`);
    }

    usersUser.updatePassword(hashedPassword);
    await this.usersRepository.save(usersUser);
  }

  // ===== Domain Mapping =====

  private mapAuthUserToUsersUser(authUser: AuthUser): UsersUser {
    const profile = new UserProfile({
      fullName: authUser.fullName,
      bio: undefined,
      avatar: authUser.avatar || undefined,
      location: undefined,
      websiteUrl: undefined,
      dateOfBirth: undefined,
      phoneNumber: undefined,
      gender: undefined,
      lastProfileUpdate: undefined,
    });

    return new UsersUser(
      authUser.id,
      authUser.username,
      authUser.email.value,
      profile,
      {
        passwordHash: authUser.hashedPassword,
        role: AUTH_TO_USERS_ROLE[authUser.role],
        isEmailVerified: authUser.isEmailVerified,
        emailVerifiedAt: authUser.emailVerifiedAt || undefined,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
      },
    );
  }

  private mapUsersUserToAuthUser(usersUser: UsersUser): AuthUser {
    return AuthUser.fromPersistence({
      id: usersUser.id,
      email: new Email(usersUser.email),
      username: usersUser.username,
      fullName: usersUser.profile.fullName,
      hashedPassword: usersUser.passwordHash || '',
      role: USERS_TO_AUTH_ROLE[usersUser.role],
      isEmailVerified: usersUser.isEmailVerified,
      emailVerifiedAt: usersUser.emailVerifiedAt || null,
      avatar: usersUser.profile.avatar || null,
      createdAt: usersUser.createdAt,
      updatedAt: usersUser.updatedAt,
      lastLoginAt: null,
    });
  }
}
