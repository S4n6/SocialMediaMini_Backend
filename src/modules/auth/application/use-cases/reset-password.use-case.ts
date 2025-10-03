import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ResetPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import * as bcrypt from 'bcrypt';
import { AuthUserService } from '../auth-user.service';

@Injectable()
export class ResetPasswordUseCase extends BaseUseCase<
  ResetPasswordRequest,
  PasswordResetResult
> {
  constructor(private authUserService: AuthUserService) {
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

    // Find user by reset token
    const user = await this.authUserService.findUserByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.authUserService.updateUserPassword(user.id, hashedPassword);

    // Note: Clear reset token functionality needs to be implemented in AuthUserService
    // TODO: Add clearPasswordResetToken method

    return {
      success: true,
      message:
        'Password has been reset successfully. You can now login with your new password.',
    };
  }
}
