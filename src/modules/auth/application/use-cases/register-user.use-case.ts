import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RegisterUserRequest } from './auth.dtos';
import { RegisterResult } from '../../domain/entities';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import { IUserRepository } from 'src/modules/users/domain/repositories/user.repository';
import { UserFactory } from '../../../users/domain/factories/user.factory';
import { UserRole } from 'src/modules/users/domain';
import { VerificationTokenAppService } from '../services/verification-token-app.service';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { IEmailSender } from '../../domain/repositories/email-sender.repository';
import { Email } from '../../domain';
import {
  UserAlreadyExistsException,
  UsernameAlreadyTakenException,
  EmailNotVerifiedException,
} from '../../domain/exceptions/auth.exceptions';

@Injectable()
export class RegisterUserUseCase extends BaseUseCase<
  RegisterUserRequest,
  RegisterResult
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private userRepository: IUserRepository,
    @Inject(EMAIL_SENDER_TOKEN)
    private mailerService: IEmailSender,
    private verificationTokenAppService: VerificationTokenAppService,
  ) {
    super();
  }

  async execute(request: RegisterUserRequest): Promise<RegisterResult> {
    const { username, email, fullName, avatar } = request;

    // Check if user already exists using string values
    const existingUserByEmail = await this.userRepository.findByEmail(email);
    if (existingUserByEmail) {
      if (!existingUserByEmail.isEmailVerified) {
        throw new EmailNotVerifiedException(
          'Email already registered but not verified. Please verify your email or request a new verification email.',
        );
      }
      throw new UserAlreadyExistsException(email);
    }

    const existingUserByUsername =
      await this.userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new UsernameAlreadyTakenException(username);
    }

    // Create user using UserFactory
    const newUser = await UserFactory.createUser({
      username,
      email,
      profile: {
        fullName,
        avatar,
        dateOfBirth: request.dateOfBirth,
        phoneNumber: request.phoneNumber,
        gender: request.gender,
        lastProfileUpdate: new Date(),
      },
      role: UserRole.USER,
    });

    // Save user first to get the actual user ID
    await this.userRepository.save(newUser);

    // Generate DB-backed verification token
    const verificationToken =
      await this.verificationTokenAppService.createToken(
        newUser.id,
        VerificationTokenType.EMAIL_VERIFICATION,
      );

    // Send verification email
    try {
      const emailVO = new Email(newUser.email);
      await this.mailerService.sendVerificationEmail(
        emailVO,
        newUser.profile.fullName,
        verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
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
