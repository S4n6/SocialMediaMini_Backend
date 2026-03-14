import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ResendVerificationRequest } from './auth.dtos';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenAppService } from '../services/verification-token-app.service';
import { IEmailSender } from '../../domain/repositories/email-sender.repository';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';
import {
  UserNotFoundException,
  EmailAlreadyVerifiedException,
  RateLimitExceededException,
} from '../../domain/exceptions/auth.exceptions';

@Injectable()
export class ResendVerificationUseCase extends BaseUseCase<
  ResendVerificationRequest,
  { success: boolean; message: string }
> {
  // Minimum interval between resends in seconds
  private readonly minIntervalSeconds = 60;

  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenAppService: VerificationTokenAppService,
    @Inject(EMAIL_SENDER_TOKEN) private emailSender: IEmailSender,
  ) {
    super();
  }

  async execute(
    request: ResendVerificationRequest,
  ): Promise<{ success: boolean; message: string }> {
    const { email } = request;

    const user = await this.userApplicationService.findUserEntityByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }

    if (user.isEmailVerified) {
      throw new EmailAlreadyVerifiedException();
    }

    // Rate limiting: Check last verification sent timestamp
    const lastSent = user.lastVerificationSentAt
      ? new Date(user.lastVerificationSentAt).getTime()
      : 0;
    const now = Date.now();

    if (lastSent && (now - lastSent) / 1000 < this.minIntervalSeconds) {
      throw new RateLimitExceededException(
        `Please wait ${this.minIntervalSeconds} seconds before requesting another verification email`,
      );
    }

    // Generate DB-backed verification token (invalidates previous ones)
    const token = await this.verificationTokenAppService.createToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    // Send email via injected email sender
    try {
      await this.emailSender.sendVerificationEmail(
        new Email(user.email),
        user.profile.fullName,
        token,
      );
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      // Don't fail the request - token was generated successfully
    }

    // Update last verification sent timestamp
    await this.userApplicationService.updateVerificationTimestamp(
      user.id,
      new Date(),
    );

    return {
      success: true,
      message: 'Verification email resent successfully',
    };
  }
}
