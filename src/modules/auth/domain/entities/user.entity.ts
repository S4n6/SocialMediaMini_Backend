import { Email } from '../value-objects/email.vo';

/**
 * User Domain Entity
 * Pure domain entity with business logic and invariants
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly username: string,
    public readonly fullName: string,
    public readonly hashedPassword: string,
    public readonly role: UserRole,
    public readonly isEmailVerified: boolean,
    public readonly emailVerifiedAt: Date | null,
    public readonly avatar: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastLoginAt: Date | null,
  ) {
    this.validateInvariants();
  }

  /**
   * Create a new user (factory method)
   */
  static create(props: {
    id: string;
    email: Email;
    username: string;
    fullName: string;
    hashedPassword: string;
    role?: UserRole;
    avatar?: string;
  }): User {
    return new User(
      props.id,
      props.email,
      props.username,
      props.fullName,
      props.hashedPassword,
      props.role || UserRole.USER,
      false, // Email not verified by default
      null, // Email not verified yet
      props.avatar || null,
      new Date(),
      new Date(),
      null, // Never logged in
    );
  }

  /**
   * Reconstruct user from persistence (factory method)
   */
  static fromPersistence(props: {
    id: string;
    email: Email;
    username: string;
    fullName: string;
    hashedPassword: string;
    role: UserRole;
    isEmailVerified: boolean;
    emailVerifiedAt: Date | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }): User {
    return new User(
      props.id,
      props.email,
      props.username,
      props.fullName,
      props.hashedPassword,
      props.role,
      props.isEmailVerified,
      props.emailVerifiedAt,
      props.avatar,
      props.createdAt,
      props.updatedAt,
      props.lastLoginAt,
    );
  }

  /**
   * Verify user's email
   */
  verifyEmail(): User {
    if (this.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    return new User(
      this.id,
      this.email,
      this.username,
      this.fullName,
      this.hashedPassword,
      this.role,
      true, // Email verified
      new Date(), // Verification timestamp
      this.avatar,
      this.createdAt,
      new Date(), // Updated timestamp
      this.lastLoginAt,
    );
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(): User {
    return new User(
      this.id,
      this.email,
      this.username,
      this.fullName,
      this.hashedPassword,
      this.role,
      this.isEmailVerified,
      this.emailVerifiedAt,
      this.avatar,
      this.createdAt,
      new Date(), // Updated timestamp
      new Date(), // Last login timestamp
    );
  }

  /**
   * Change user password (with new hashed password)
   */
  changePassword(newHashedPassword: string): User {
    if (!newHashedPassword) {
      throw new Error('Hashed password is required');
    }

    return new User(
      this.id,
      this.email,
      this.username,
      this.fullName,
      newHashedPassword,
      this.role,
      this.isEmailVerified,
      this.emailVerifiedAt,
      this.avatar,
      this.createdAt,
      new Date(), // Updated timestamp
      this.lastLoginAt,
    );
  }

  /**
   * Update user profile
   */
  updateProfile(props: {
    username?: string;
    fullName?: string;
    avatar?: string;
  }): User {
    return new User(
      this.id,
      this.email,
      props.username || this.username,
      props.fullName || this.fullName,
      this.hashedPassword,
      this.role,
      this.isEmailVerified,
      this.emailVerifiedAt,
      props.avatar !== undefined ? props.avatar : this.avatar,
      this.createdAt,
      new Date(), // Updated timestamp
      this.lastLoginAt,
    );
  }

  /**
   * Check if user can login
   */
  canLogin(): boolean {
    return this.isEmailVerified;
  }

  /**
   * Get user age in days
   */
  getAccountAge(): number {
    const now = new Date();
    const diffInMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  private validateInvariants(): void {
    if (!this.id) {
      throw new Error('User ID is required');
    }

    if (!this.username || this.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!this.fullName || this.fullName.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long');
    }

    if (!this.hashedPassword) {
      throw new Error('Hashed password is required');
    }

    if (!Object.values(UserRole).includes(this.role)) {
      throw new Error('Invalid user role');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: UserRole;
    isEmailVerified: boolean;
    emailVerifiedAt: Date | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  } {
    return {
      id: this.id,
      email: this.email.value,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
      isEmailVerified: this.isEmailVerified,
      emailVerifiedAt: this.emailVerifiedAt,
      avatar: this.avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
}

/**
 * User Role Enum
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

// Legacy interfaces for backward compatibility (will be removed gradually)
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  password?: string;
  avatar?: string;
  role: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserCreationData {
  username: string;
  email: string;
  fullName: string;
  password?: string;
  avatar?: string;
  role?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
}

export interface AuthUserUpdateData {
  username?: string;
  email?: string;
  fullName?: string;
  password?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
