import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ForgotPasswordRequest } from './auth.dtos';
import { PasswordResetResult } from '../../domain/entities';
import { AuthUserService } from '../auth-user.service';
import { IEmailSender } from '../interfaces/email-sender.interface';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';

@Injectable()
export class ForgotPasswordUseCase extends BaseUseCase<
  ForgotPasswordRequest,
  PasswordResetResult
> {
  // Minimum interval between password reset requests in seconds
  private readonly minIntervalSeconds = 60;

  constructor(
    private authUserService: AuthUserService,
    @Inject(EMAIL_SENDER_TOKEN) private emailSender: IEmailSender,
    private verificationTokenService: VerificationTokenService,
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

    // Rate limiting: Check last password reset request timestamp
    // Using lastProfileUpdate as placeholder for lastPasswordResetSentAt
    const lastSent = user.lastProfileUpdate
      ? new Date(user.lastProfileUpdate).getTime()
      : 0;
    const now = Date.now();

    if (lastSent && (now - lastSent) / 1000 < this.minIntervalSeconds) {
      throw new BadRequestException(
        `Please wait ${this.minIntervalSeconds} seconds before requesting another password reset email`,
      );
    }

    // Generate JWT reset token using VerificationTokenService (no need to store in database)
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
      throw new Error('Failed to send password reset email');
    }

    // Update last password reset sent timestamp
    await this.authUserService.updateLastVerificationSentAt(
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
