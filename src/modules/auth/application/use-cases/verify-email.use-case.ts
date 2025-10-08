import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { VerifyEmailRequest } from './auth.dtos';
import { EmailVerificationResult } from '../../domain/entities';
import * as bcrypt from 'bcrypt';
import { AuthUserService } from '../auth-user.service';

@Injectable()
export class VerifyEmailUseCase extends BaseUseCase<
  VerifyEmailRequest,
  EmailVerificationResult
> {
  constructor(private authUserService: AuthUserService) {
    super();
  }

  async execute(request: VerifyEmailRequest): Promise<EmailVerificationResult> {
    const { token, password } = request;

    console.log('Verifying email with token:', token, password); // --- IGNORE ---

    // Find user by verification token
    const user = await this.authUserService.verifyEmailByToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    // If user already verified
    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Email has already been verified',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.profile.fullName,
          isEmailVerified: true,
        },
      };
    }

    // If password is provided, set it for the user
    if (password) {
      if (password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await this.authUserService.updateUserPassword(user.id, hashedPassword);
      await this.authUserService.verifyUserEmail(user.id);
    } else {
      // Just verify email without setting password
      await this.authUserService.verifyUserEmail(user.id);
    }

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
