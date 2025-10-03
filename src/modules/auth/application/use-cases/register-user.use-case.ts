import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RegisterUserRequest } from './auth.dtos';
import { RegisterResult } from '../../domain/entities';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.module';
import { ROLES } from '../../../../shared/constants/roles.constant';
import { mailQueue } from '../../../../queues/mail.queue';
import * as crypto from 'crypto';
import { IUserRepository } from 'src/modules/users/application';
import { UserFactory } from '../../../users/domain/factories/user.factory';
import { UserEmail, Username } from '../../../users/domain/value-objects';
import { console } from 'inspector';

@Injectable()
export class RegisterUserUseCase extends BaseUseCase<
  RegisterUserRequest,
  RegisterResult
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private userRepository: IUserRepository,
  ) {
    super();
  }

  async execute(request: RegisterUserRequest): Promise<RegisterResult> {
    const { username, email, fullName, avatar, password } = request;

    // Check if user already exists using string values
    const existingUserByEmail = await this.userRepository.findByEmail(email);
    console.log('Checking email availability:', existingUserByEmail);
    if (existingUserByEmail) {
      if (!existingUserByEmail.isEmailVerified) {
        throw new BadRequestException(
          'Email already registered but not verified. Please verify your email or request a new verification email.',
        );
      }
      throw new ConflictException('Email already registered');
    }

     // Debug log

    const existingUserByUsername =
      await this.userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already taken');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user using UserFactory
    const newUser = await UserFactory.createUser({
      username,
      email,
      password,
      profile: {
        fullName,
        avatar,
      },
    });

    // Set verification token (you might need to add this method to User entity)
    // For now, we'll handle verification separately after saving

    // Save user
    await this.userRepository.save(newUser);

    // Send verification email using mail queue
    try {
      await mailQueue.add('sendVerificationEmail', {
        email,
        token: verificationToken,
        username,
        fullName,
      });
    } catch (error) {
      console.error('Failed to queue verification email:', error);
    }

    return {
      success: true,
      message:
        'Registration successful! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.profile.fullName,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        avatar: newUser.profile.avatar || undefined,
      },
    };
  }
}
