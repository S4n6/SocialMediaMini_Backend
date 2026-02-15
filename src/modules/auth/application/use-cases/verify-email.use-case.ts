import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { VerifyEmailRequest } from './auth.dtos';
import { EmailVerificationResult } from '../../domain/entities';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';
import { Password } from '../../domain/value-objects/password.vo';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { PASSWORD_HASHER_TOKEN } from '../../auth.constants';
import {
  UserNotFoundException,
  InvalidTokenException,
  EmailAlreadyVerifiedException,
} from '../../domain/exceptions/auth.exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailVerifiedEvent } from '../../domain/events';

@Injectable()
export class VerifyEmailUseCase extends BaseUseCase<
  VerifyEmailRequest,
  EmailVerificationResult
> {
  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenService: VerificationTokenService,
    @Inject(PASSWORD_HASHER_TOKEN)
    private passwordHasher: IPasswordHasher,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(request: VerifyEmailRequest): Promise<EmailVerificationResult> {
    const { token, password } = request;

    // Verify the email verification token
    const tokenPayload =
      await this.verificationTokenService.verifyEmailVerificationToken(token);
    if (!tokenPayload) {
      throw new InvalidTokenException('email-verification');
    }

    // Find user by ID from token payload
    const user = await this.userApplicationService.findUserEntityById(
      tokenPayload.userId,
    );
    if (!user) {
      throw new UserNotFoundException(tokenPayload.userId);
    }

    // Verify that the email in token matches user's email (security check)
    if (user.email !== tokenPayload.email) {
      throw new InvalidTokenException('email-verification');
    }

    // If user already verified
    if (user.isEmailVerified) {
      throw new EmailAlreadyVerifiedException();
    }

    // If password is provided, set it for the user
    if (password) {
      // Validate password using Password value object
      const passwordVO = new Password(password);
      const hashedPassword = await this.passwordHasher.hash(passwordVO);

      await this.userApplicationService.updateUserPassword(
        user.id,
        hashedPassword,
      );
      await this.userApplicationService.verifyEmail(user.id);
    } else {
      // Just verify email without setting password
      await this.userApplicationService.verifyEmail(user.id);
    }

    // Emit EmailVerifiedEvent for side effects (send welcome email)
    this.eventEmitter.emit(
      'auth.email.verified',
      new EmailVerifiedEvent(user.id, user.email, new Date()),
    );

    return {
      success: true,
      message: 'Email verified successfully! You can now login.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.profile.fullName,
        isEmailVerified: true,
      },
    };
  }
}
