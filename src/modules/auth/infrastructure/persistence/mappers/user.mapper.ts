import { Injectable } from '@nestjs/common';
import { User as AuthUser } from '../../../domain/entities/user.entity';
import { User as UsersUser } from '../../../../users/domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserProfile } from '../../../../users/domain/value-objects/user-profile.value-object';

/**
 * User Mapper
 * Maps between Auth User entity and Users User entity
 * Handles cross-module domain translation
 */
@Injectable()
export class UserMapper {
  /**
   * Map Auth User to Users User for persistence
   */
  toUsersUser(authUser: AuthUser): UsersUser {
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
  toAuthUser(usersUser: UsersUser): AuthUser {
    return AuthUser.fromPersistence({
      id: usersUser.id,
      email: new Email(usersUser.email),
      username: usersUser.username,
      fullName: usersUser.profile.fullName,
      hashedPassword: usersUser.passwordHash || '',
      role: usersUser.role as any, // Map role enum
      isEmailVerified: usersUser.isEmailVerified,
      emailVerifiedAt: usersUser.emailVerifiedAt || null,
      avatar: usersUser.profile.avatar || null,
      createdAt: usersUser.createdAt,
      updatedAt: usersUser.updatedAt,
      lastLoginAt: null, // Auth specific field not in Users domain
    });
  }
}
