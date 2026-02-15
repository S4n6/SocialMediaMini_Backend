import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RegisterUserRequest } from './auth.dtos';
import { RegisterResult } from '../../domain/entities';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import { IUserRepository } from 'src/modules/users/domain/repositories/user.repository';
import { UserFactory } from '../../../users/domain/factories/user.factory';
import { UserRole } from 'src/modules/users/domain';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { VerificationTokenService } from '../../infrastructure/services/verification-token.service';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';
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
    private userApplicationService: UserApplicationService,
    private verificationTokenService: VerificationTokenService,
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenRepository: ITokenRepository,
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

    // Generate JWT verification token with actual user ID
    // Generate verification token via TokenRepository (non-persistent token)
    const verificationToken =
      await this.tokenRepository.generateEmailVerificationToken(
        newUser.id,
        newUser.email,
      );

    // Send verification email using mail queue and MailerService
    try {
      // Also attempt to send immediately via MailerService
      const tokenString = verificationToken;
      const emailVO = new Email(newUser.email);
      await this.mailerService.sendVerificationEmail(
        emailVO,
        newUser.profile.fullName,
        tokenString,
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
