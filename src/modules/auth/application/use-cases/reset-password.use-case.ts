import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseUseCase } from './base.use-case';
import { ResetPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import { PasswordChangedEvent } from '../../domain/events';
import * as bcrypt from 'bcrypt';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';

@Injectable()
export class ResetPasswordUseCase extends BaseUseCase<
  ResetPasswordRequest,
  PasswordResetResult
> {
  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenService: VerificationTokenService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(request: ResetPasswordRequest): Promise<PasswordResetResult> {
    const { token, newPassword, confirmPassword } = request;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate password strength (basic validation)
    if (newPassword.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    // Verify the reset token using VerificationTokenService
    const tokenPayload =
      await this.verificationTokenService.verifyPasswordResetToken(token);
    if (!tokenPayload) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Find user by ID from token payload
    const user = await this.userApplicationService.findUserEntityById(
      tokenPayload.userId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify that the email in token matches user's email (security check)
    if (user.email !== tokenPayload.email) {
      throw new UnauthorizedException(
        'Token email mismatch - possible security breach',
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.userApplicationService.updateUserPassword(
      user.id,
      hashedPassword,
    );

    // Emit domain event
    const passwordChangedEvent = new PasswordChangedEvent(user.id, user.email);
    this.eventEmitter.emit('password.changed', passwordChangedEvent);

    return {
      success: true,
      message:
        'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
