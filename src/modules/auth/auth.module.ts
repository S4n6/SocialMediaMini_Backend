import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Import tokens from constants
import {
  SESSION_REPOSITORY_TOKEN,
  TOKEN_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  EMAIL_SENDER_TOKEN,
} from './auth.constants';

// Application Layer
import { AuthApplicationService } from './application/auth-application.service';

// Infrastructure Layer - Repository Implementations
import { SessionRepository } from './infrastructure/repositories/session.repository';
import { TokenRepository } from './infrastructure/repositories/token.repository';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';

// Infrastructure Layer - Service Implementations
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenGenerator } from './infrastructure/security/jwt-token-generator';
import { MailerEmailSender } from './infrastructure/services/mailer-email.service';

// Domain Services
import { SessionDomainService } from './domain/services/session-domain.service';

// Presentation Layer
import { AuthController } from './presentation/auth.controller';

// Use Cases
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { LogoutAllUseCase } from './application/use-cases/logout-all.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { AuthenticationService } from './infrastructure/repositories/authentication.repository';
import { VerificationTokenService } from './infrastructure/services/verification-token.service';
import { JwtStrategy } from './presentation/strategies/Jwt.strategy';
import { GoogleStrategy } from './presentation/strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { JWT } from 'src/config/jwt.config';
import { MailerModule } from '../mailer/mailer.module';
// import { NotificationModule } from '../notification/notification.module'; // TODO: Refactor notification module
import { RedisCacheModule } from '../cache/cache.module';
import { PrismaModule } from '../../database/prisma.module';

// Event Subscribers
import {
  PasswordChangedSubscriber,
  EmailVerifiedSubscriber,
  UserLoggedInSubscriber,
} from './application/subscribers';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({
      secret: JWT.SECRET,
      signOptions: { expiresIn: JWT.EXPIRES_IN },
    }),
    MailerModule,
    // NotificationModule, // TODO: Refactor notification module
    RedisCacheModule,
  ],
  controllers: [AuthController],
  providers: [
    // Application Service
    AuthApplicationService,

    // Repositories
    {
      provide: SESSION_REPOSITORY_TOKEN,
      useClass: SessionRepository,
    },
    {
      provide: TOKEN_REPOSITORY_TOKEN,
      useClass: TokenRepository,
    },
    AuthUserRepository,

    // Domain Services
    SessionDomainService,

    // Services
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_GENERATOR_TOKEN,
      useClass: JwtTokenGenerator,
    },
    {
      provide: EMAIL_SENDER_TOKEN,
      useClass: MailerEmailSender,
    },

    // Use Cases
    RegisterUserUseCase,
    LoginUseCase,
    GoogleAuthUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyEmailUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    LogoutAllUseCase,
    ResendVerificationUseCase,

    // Infrastructure Services
    AuthenticationService,
    VerificationTokenService,

    // Presentation
    JwtStrategy,
    GoogleStrategy,

    // Event Subscribers
    PasswordChangedSubscriber,
    EmailVerifiedSubscriber,
    UserLoggedInSubscriber,
  ],
  exports: [
    AuthApplicationService,
    SESSION_REPOSITORY_TOKEN,
    TOKEN_REPOSITORY_TOKEN,
    PASSWORD_HASHER_TOKEN,
    TOKEN_GENERATOR_TOKEN,
    EMAIL_SENDER_TOKEN,
    AuthUserRepository,
    AuthenticationService,
    VerificationTokenService,
  ],
})
export class AuthModule {}
