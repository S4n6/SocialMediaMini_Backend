import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RegisterUserRequest } from './auth.dtos';
import { RegisterResult } from '../../domain/entities';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import { MailerService } from '../../../mailer/mailer.service';
import { IUserRepository } from 'src/modules/users/application';
import { UserFactory } from '../../../users/domain/factories/user.factory';
import { console } from 'inspector';
import { UserRole } from 'src/modules/users/domain';
import { AuthUserService } from '../auth-user.service';
import { ITokenRepository } from '../interfaces/token.repository.interface';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { IEmailSender } from '../interfaces';
import { Email } from '../../domain';

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
    private authUserService: AuthUserService,
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
        throw new BadRequestException(
          'Email already registered but not verified. Please verify your email or request a new verification email.',
        );
      }
      throw new ConflictException('Email already registered');
    }

    const existingUserByUsername =
      await this.userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already taken');
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
      const email = new Email(newUser.email);
      if (!email) {
        throw new BadRequestException('Invalid email address');
      }
      await this.mailerService.sendVerificationEmail(
        email,
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
