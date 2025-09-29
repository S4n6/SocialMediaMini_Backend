import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ForgotPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../entities';
import { IUserRepository } from '../repositories';
import { mailQueue } from '../../../../queues/mail.queue';
import * as crypto from 'crypto';

@Injectable()
export class ForgotPasswordUseCase extends BaseUseCase<
  ForgotPasswordRequest,
  PasswordResetResult
> {
  constructor(private userRepository: IUserRepository) {
    super();
  }

  async execute(request: ForgotPasswordRequest): Promise<PasswordResetResult> {
    const { email } = request;

    // Check if user exists
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new NotFoundException(
        'Please verify your email first before requesting password reset',
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token
    await this.userRepository.setPasswordResetToken(
      user.id,
      resetToken,
      resetTokenExpires,
    );

    // Send password reset email using queue
    try {
      await mailQueue.add('sendPasswordResetEmail', {
        email: user.email,
        resetToken,
        username: user.userName,
      });
    } catch (error) {
      console.error('Failed to queue password reset email:', error);
    }

    return {
      success: true,
      message:
        'Password reset instructions have been sent to your email address',
    };
  }
}
