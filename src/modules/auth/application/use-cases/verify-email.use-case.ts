import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { VerifyEmailRequest } from './auth.dtos';
import { EmailVerificationResult } from '../../domain/entities';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenAppService } from '../services/verification-token-app.service';
import { Password } from '../../domain/value-objects/password.vo';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { PASSWORD_HASHER_TOKEN } from '../../auth.constants';
import {
  UserNotFoundException,
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
    private verificationTokenAppService: VerificationTokenAppService,
    @Inject(PASSWORD_HASHER_TOKEN)
    private passwordHasher: IPasswordHasher,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(request: VerifyEmailRequest): Promise<EmailVerificationResult> {
    const { token, password } = request;

    // Verify the DB-backed email verification token
    // Throws TokenExpiredException or InvalidTokenException automatically
    const verificationToken =
      await this.verificationTokenAppService.verifyToken(
        token,
        VerificationTokenType.EMAIL_VERIFICATION,
      );

    // Find user by ID from token entity
    const user = await this.userApplicationService.findUserEntityById(
      verificationToken.userId,
    );
    if (!user) {
      throw new UserNotFoundException(verificationToken.userId);
    }

    // If user already verified
    if (user.isEmailVerified) {
      throw new EmailAlreadyVerifiedException();
    }

    // If password is provided, set it for the user
    if (password) {
      const passwordVO = new Password(password);
      const hashedPassword = await this.passwordHasher.hash(passwordVO);

      await this.userApplicationService.updateUserPassword(
        user.id,
        hashedPassword,
      );
      await this.userApplicationService.verifyEmail(user.id);
    } else {
      await this.userApplicationService.verifyEmail(user.id);
    }

    // Consume the token so it cannot be reused
    await this.verificationTokenAppService.consumeToken(verificationToken);

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
