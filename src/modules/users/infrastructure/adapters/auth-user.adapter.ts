import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';

/**
 * Adapter for Auth module integration
 * Provides auth-specific user operations without violating clean architecture
 */
export interface IAuthUserAdapter {
  // Auth-specific user operations
  findUserByEmailOrUsername(identifier: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateLastVerificationSentAt(userId: string, timestamp: Date): Promise<void>;
  createUserFromGoogle(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<User>;
  saveUser(user: User): Promise<void>;
}

/**
 * Implementation of Auth User Adapter
 * Delegates to existing use cases and repository
 */
@Injectable()
export class AuthUserAdapter implements IAuthUserAdapter {
  constructor() // We'll inject the use cases here instead of directly accessing repository
  // This maintains the clean architecture boundary
  {}

  async findUserByEmailOrUsername(identifier: string): Promise<User | null> {
    // Implementation will delegate to existing use cases
    throw new Error('Method not implemented.');
  }

  async findUserById(userId: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }

  async findUserByEmail(email: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }

  async existsByEmail(email: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async existsByUsername(username: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateLastVerificationSentAt(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createUserFromGoogle(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<User> {
    throw new Error('Method not implemented.');
  }

  async saveUser(user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
