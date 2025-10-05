import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ForgotPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import { AuthUserService } from '../auth-user.service';
import { IEmailSender } from '../interfaces/email-sender.interface';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';

@Injectable()
export class ForgotPasswordUseCase extends BaseUseCase<
  ForgotPasswordRequest,
  PasswordResetResult
> {
  constructor(
    private authUserService: AuthUserService,
    @Inject(EMAIL_SENDER_TOKEN) private emailSender: IEmailSender,
  ) {
    super();
  }

  async execute(request: ForgotPasswordRequest): Promise<PasswordResetResult> {
    const { email } = request;

    // Check if user exists
    const user = await this.authUserService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new NotFoundException(
        'Please verify your email first before requesting password reset',
      );
    }

    // Generate JWT reset token (no need to store in database)
    const resetToken = this.authUserService.generatePasswordResetToken(
      user.id,
      user.email,
    );

    // Send password reset email directly via email sender
    try {
      const tokenString = await resetToken;
      await this.emailSender.sendPasswordResetEmail(
        new Email(user.email),
        tokenString,
        user.profile.fullName,
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return {
      success: true,
      message:
        'Password reset instructions have been sent to your email address',
    };
  }
}
