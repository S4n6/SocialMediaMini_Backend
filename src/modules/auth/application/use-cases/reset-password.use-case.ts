import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ResetPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenAppService } from '../services/verification-token-app.service';
import { Password } from '../../domain/value-objects/password.vo';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { PASSWORD_HASHER_TOKEN } from '../../auth.constants';
import {
  PasswordMismatchException,
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
    private verificationTokenAppService: VerificationTokenAppService,
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

    // Verify the DB-backed reset token
    // Throws TokenExpiredException or InvalidTokenException automatically
    const verificationToken =
      await this.verificationTokenAppService.verifyToken(
        token,
        VerificationTokenType.PASSWORD_RESET,
      );

    // Find user by ID from token entity
    const user = await this.userApplicationService.findUserEntityById(
      verificationToken.userId,
    );
    if (!user) {
      throw new UserNotFoundException(verificationToken.userId);
    }

    // Hash new password using IPasswordHasher
    const hashedPassword = await this.passwordHasher.hash(passwordVO);

    // Update user password
    await this.userApplicationService.updateUserPassword(
      user.id,
      hashedPassword,
    );

    // Consume the token so it cannot be reused
    await this.verificationTokenAppService.consumeToken(verificationToken);

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
