import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ResetPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../entities';
import { IUserRepository } from '../repositories';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordUseCase extends BaseUseCase<ResetPasswordRequest, PasswordResetResult> {
  constructor(
    private userRepository: IUserRepository,
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
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    // Find user by reset token
    const user = await this.userRepository.findUserByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.userRepository.updateUserPassword(user.id, hashedPassword);

    // Clear reset token
    await this.userRepository.clearPasswordResetToken(user.id);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}