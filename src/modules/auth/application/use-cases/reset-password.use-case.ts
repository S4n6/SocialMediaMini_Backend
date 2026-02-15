import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ResetPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';
import { Password } from '../../domain/value-objects/password.vo';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { PASSWORD_HASHER_TOKEN } from '../../auth.constants';
import {
  PasswordMismatchException,
  InvalidTokenException,
  UserNotFoundException,
} from '../../domain/exceptions/auth.exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PasswordChangedEvent } from '../../domain/events';

@Injectable()
export class ResetPasswordUseCase extends BaseUseCase<
  ResetPasswordRequest,
  PasswordResetResult
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

  async execute(request: ResetPasswordRequest): Promise<PasswordResetResult> {
    const { token, newPassword, confirmPassword } = request;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new PasswordMismatchException();
    }

    // Validate password strength using Password value object
    const passwordVO = new Password(newPassword);

    // Verify the reset token using VerificationTokenService
    const tokenPayload =
      await this.verificationTokenService.verifyPasswordResetToken(token);
    if (!tokenPayload) {
      throw new InvalidTokenException('password-reset');
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
      throw new InvalidTokenException('password-reset');
    }

    // Hash new password using IPasswordHasher
    const hashedPassword = await this.passwordHasher.hash(passwordVO);

    // Update user password
    await this.userApplicationService.updateUserPassword(
      user.id,
      hashedPassword,
    );

    // Emit PasswordChangedEvent for side effects (revoke sessions, send notification)
    this.eventEmitter.emit(
      'auth.password.changed',
      new PasswordChangedEvent(user.id, user.email),
    );

    return {
      success: true,
      message:
        'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
