import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories';
import { USER_REPOSITORY_TOKEN } from '../../users.constants';
import { User } from '../../domain';

/**
 * Find User By Credentials Use Case
 * Used by Auth module for login functionality
 */
@Injectable()
export class FindUserByCredentialsUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Find user by email or username
   */
  async execute(identifier: string): Promise<User | null> {
    return this.userRepository.findByEmailOrUsername(identifier);
  }
}

/**
 * Find User By ID Use Case
 * Used by Auth module for token validation
 */
@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }
}

/**
 * Find User By Email Use Case
 * Used by Auth module for OAuth and password reset
 */
@Injectable()
export class FindUserByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }
}

/**
 * Check User Existence Use Case
 * Used by Auth module for validation
 */
@Injectable()
export class CheckUserExistenceUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async existsByUsername(username: string): Promise<boolean> {
    return this.userRepository.existsByUsername(username);
  }
}
