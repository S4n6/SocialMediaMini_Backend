import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { VerifyEmailRequest } from './auth.dtos';
import { EmailVerificationResult } from '../entities';
import { IUserRepository } from '../repositories';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VerifyEmailUseCase extends BaseUseCase<VerifyEmailRequest, EmailVerificationResult> {
  constructor(
    private userRepository: IUserRepository,
  ) {
    super();
  }

  async execute(request: VerifyEmailRequest): Promise<EmailVerificationResult> {
    const { token, password } = request;

    // Find user by verification token
    const user = await this.userRepository.verifyEmailByToken(token);
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
          userName: user.userName,
          fullName: user.fullName,
          isEmailVerified: true,
        },
      };
    }

    // If password is provided, set it for the user
    if (password) {
      if (password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      await this.userRepository.updateUser(user.id, {
        password: hashedPassword,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: undefined,
      });
    } else {
      // Just verify email without setting password
      await this.userRepository.updateUser(user.id, {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: undefined,
      });
    }

    return {
      success: true,
      message: 'Email verified successfully! You can now login.',
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        fullName: user.fullName,
        isEmailVerified: true,
      },
    };
  }
}