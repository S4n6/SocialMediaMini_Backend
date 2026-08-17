import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { VerifyEmailRequest } from './auth.dtos';
import { EmailVerificationResult } from '../../domain/entities';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenAppService } from '../services/verification-token-app.service';
import { Password } from '../../domain/value-objects/password.vo';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { PASSWORD_HASHER_TOKEN } from '../../auth.constants';
import {
  UserNotFoundException,
  EmailAlreadyVerifiedException,
} from '../../domain/exceptions/auth.exceptions';

@Injectable()
export class VerifyEmailUseCase extends BaseUseCase<
  VerifyEmailRequest,
  EmailVerificationResult
> {
  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenAppService: VerificationTokenAppService,
    @Inject(PASSWORD_HASHER_TOKEN)
    private passwordHasher: IPasswordHasher,
  ) {
    super();
  }

  async execute(request: VerifyEmailRequest): Promise<EmailVerificationResult> {
    const { email, code, password } = request;

    // 1. Find user by email to obtain their userId
    const user = await this.userApplicationService.findUserEntityByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }

    // 2. If user already verified, bail early
    if (user.isEmailVerified) {
      throw new EmailAlreadyVerifiedException();
    }

    // 3. Verify the 6-digit OTP (looks up by userId, enforces attempt limit)
    const verificationToken = await this.verificationTokenAppService.verifyOtp(
      user.id,
      code,
    );

    // 4. Optionally set password (first-time registration flow)
    if (password) {
      const passwordVO = new Password(password);
      const hashedPassword = await this.passwordHasher.hash(passwordVO);
      await this.userApplicationService.updateUserPassword(user.id, hashedPassword);
    }

    // 5. Mark email as verified
    await this.userApplicationService.verifyEmail(user.id);

    // 6. Consume the OTP so it cannot be reused
    await this.verificationTokenAppService.consumeToken(verificationToken);

    return {
      success: true,
      message: 'Email verified successfully! You can now login.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.profile.fullName,
        isEmailVerified: true,
      },
    };
  }
}
