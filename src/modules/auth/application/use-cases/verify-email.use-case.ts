import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseUseCase } from './base.use-case';
import { VerifyEmailRequest } from './auth.dtos';
import { EmailVerificationResult } from '../../domain/entities';
import { UserEmailVerifiedEvent } from '../../domain/events';
import * as bcrypt from 'bcrypt';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';

@Injectable()
export class VerifyEmailUseCase extends BaseUseCase<
  VerifyEmailRequest,
  EmailVerificationResult
> {
  constructor(
    private userApplicationService: UserApplicationService,
    private verificationTokenService: VerificationTokenService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(request: VerifyEmailRequest): Promise<EmailVerificationResult> {
    const { token, password } = request;

    console.log('Verifying email with token:', token, password); // --- IGNORE ---

    // Find user by verification token
    // Verify the email verification token
    const tokenPayload =
      await this.verificationTokenService.verifyEmailVerificationToken(token);
    if (!tokenPayload) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Find user by ID from token payload
    const user = await this.userApplicationService.findUserEntityById(
      tokenPayload.userId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify that the email in token matches user's email (security check)
    if (user.email !== tokenPayload.email) {
      throw new BadRequestException(
        'Token email mismatch - possible security breach',
      );
    }
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

      await this.userApplicationService.updateUserPassword(
        user.id,
        hashedPassword,
      );
      await this.userApplicationService.verifyEmail(user.id);

      // Emit domain event
      const verifiedEvent = new UserEmailVerifiedEvent(user.id, user.email);
      this.eventEmitter.emit('user.email_verified', verifiedEvent);
    } else {
      // Just verify email without setting password
      await this.userApplicationService.verifyEmail(user.id);

      // Emit domain event
      const verifiedEvent = new UserEmailVerifiedEvent(user.id, user.email);
      this.eventEmitter.emit('user.email_verified', verifiedEvent);
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
