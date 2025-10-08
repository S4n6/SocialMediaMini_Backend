import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../users/application';
import { ISessionRepository } from '../interfaces/session.repository.interface';
import { ITokenRepository } from '../interfaces/token.repository.interface';
import { IPasswordHasher } from '../interfaces/password-hasher.interface';
import { ITokenGenerator } from '../interfaces/token-generator.interface';
import { IEmailSender } from '../interfaces/email-sender.interface';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import {
  SESSION_REPOSITORY_TOKEN,
  TOKEN_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  EMAIL_SENDER_TOKEN,
} from '../../auth.constants';

/**
 * Auth Application Service
 * Orchestrates domain entities and services for authentication operations
 */
@Injectable()
export class AuthApplicationService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepository: ISessionRepository,
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private readonly tokenRepository: ITokenRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: ITokenGenerator,
    @Inject(EMAIL_SENDER_TOKEN)
    private readonly emailSender: IEmailSender,
  ) {}

  /**
   * Get repositories (for use cases that need direct access)
   */
  get repositories() {
    return {
      user: this.userRepository,
      session: this.sessionRepository,
      token: this.tokenRepository,
    };
  }

  /**
   * Get domain services (for use cases that need direct access)
   */
  get services() {
    return {
      passwordHasher: this.passwordHasher,
      tokenGenerator: this.tokenGenerator,
      emailSender: this.emailSender,
    };
  }
}
