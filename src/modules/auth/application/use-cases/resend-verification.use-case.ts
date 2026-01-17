import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ResendVerificationRequest } from './auth.dtos';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';
import { ITokenService } from '../ports/i-token.service';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';
import { IEmailService } from '../ports/i-email.service';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';

@Injectable()
export class ResendVerificationUseCase extends BaseUseCase<
  ResendVerificationRequest,
  { success: boolean; message: string }
> {
  // Minimum interval between resends in seconds
  private readonly minIntervalSeconds = 60;

  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenService: VerificationTokenService,
    @Inject(TOKEN_REPOSITORY_TOKEN) private tokenRepository: ITokenService,
    @Inject(EMAIL_SENDER_TOKEN) private emailSender: IEmailService,
  ) {
    super();
  }

  async execute(
    request: ResendVerificationRequest,
  ): Promise<{ success: boolean; message: string }> {
    const { email } = request;

    const user = await this.userApplicationService.findUserEntityByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Optional rate-limiting: Check last verification sent timestamp
    // Using lastProfileUpdate as placeholder for lastVerificationSentAt
    const lastSent = user.lastProfileUpdate
      ? new Date(user.lastProfileUpdate).getTime()
      : 0;
    const now = Date.now();

    if (lastSent && (now - lastSent) / 1000 < this.minIntervalSeconds) {
      throw new BadRequestException(
        `Please wait ${this.minIntervalSeconds} seconds before requesting another verification email`,
      );
    }

    // Generate verification token using TokenRepository
    const token = await this.tokenRepository.generateEmailVerificationToken(
      user.id,
      user.email,
    );

    // Send email via injected email sender
    await this.emailSender.sendVerificationEmail(
      new Email(user.email),
      user.profile.fullName,
      token,
    );

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
