import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ForgotPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';
import { IEmailSender } from '../../domain/repositories/email-sender.repository';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';
import {
  UserNotFoundException,
  EmailNotVerifiedException,
  RateLimitExceededException,
} from '../../domain/exceptions/auth.exceptions';

@Injectable()
export class ForgotPasswordUseCase extends BaseUseCase<
  ForgotPasswordRequest,
  PasswordResetResult
> {
  // Minimum interval between password reset requests in seconds
  private readonly minIntervalSeconds = 60;

  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenService: VerificationTokenService,
    @Inject(EMAIL_SENDER_TOKEN) private emailSender: IEmailSender,
  ) {
    super();
  }

  async execute(request: ForgotPasswordRequest): Promise<PasswordResetResult> {
    const { email } = request;

    // Check if user exists
    const user = await this.userApplicationService.findUserEntityByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedException(
        'Please verify your email first before requesting password reset',
      );
    }

    // Rate limiting: Check last password reset request timestamp
    const lastSent = user.lastPasswordResetSentAt
      ? new Date(user.lastPasswordResetSentAt).getTime()
      : 0;
    const now = Date.now();

    if (lastSent && (now - lastSent) / 1000 < this.minIntervalSeconds) {
      throw new RateLimitExceededException(
        `Please wait ${this.minIntervalSeconds} seconds before requesting another password reset email`,
      );
    }

    // Generate JWT reset token using VerificationTokenService
    const resetToken = this.verificationTokenService.generatePasswordResetToken(
      user.id,
      user.email,
    );

    // Send password reset email directly via email sender
    try {
      await this.emailSender.sendPasswordResetEmail(
        new Email(user.email),
        resetToken,
        user.profile.fullName,
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't fail the request - for security, always return success
      // This also prevents email enumeration attacks
    }

    // Update last password reset sent timestamp
    await this.userApplicationService.updatePasswordResetTimestamp(
      user.id,
      new Date(),
    );

    return {
      success: true,
      message:
        'Password reset instructions have been sent to your email address',
    };
  }
}
