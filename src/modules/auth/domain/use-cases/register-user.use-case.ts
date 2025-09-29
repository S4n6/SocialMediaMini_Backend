import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RegisterUserRequest } from './auth.dtos';
import { RegisterResult } from '../entities';
import { IUserRepository } from '../repositories';
import { ROLES } from '../../../../constants/roles.constant';
import { mailQueue } from '../../../../queues/mail.queue';
import * as crypto from 'crypto';

@Injectable()
export class RegisterUserUseCase extends BaseUseCase<
  RegisterUserRequest,
  RegisterResult
> {
  constructor(private userRepository: IUserRepository) {
    super();
  }

  async execute(request: RegisterUserRequest): Promise<RegisterResult> {
    const { userName, email, fullName } = request;

    // Check if user already exists
    const existingUserByEmail =
      await this.userRepository.findUserByEmail(email);
    if (existingUserByEmail) {
      if (!existingUserByEmail.isEmailVerified) {
        throw new BadRequestException(
          'Email already registered but not verified. Please verify your email or request a new verification email.',
        );
      }
      throw new ConflictException('Email already registered');
    }

    if (userName) {
      const existingUserByUsername =
        await this.userRepository.findUserByUsername(userName);
      if (existingUserByUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const newUser = await this.userRepository.createUser({
      userName,
      email,
      fullName,
      role: ROLES.USER,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    });

    // Send verification email using mail queue
    try {
      await mailQueue.add('sendVerificationEmail', {
        email,
        token: verificationToken,
        username: userName,
        fullname: fullName,
      });
    } catch (error) {
      console.error('Failed to queue verification email:', error);
      // Continue with registration even if email fails
    }

    return {
      success: true,
      message:
        'Registration successful! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        userName: newUser.userName,
        fullName: newUser.fullName,
      },
    };
  }
}
