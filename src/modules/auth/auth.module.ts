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

// Infrastructure Layer - Persistence (Repositories)
import { SessionRepository } from './infrastructure/persistence/repositories/session.repository';
import { UserRepository } from './infrastructure/persistence/repositories/user.repository';
import { UserMapper } from './infrastructure/persistence/mappers/user.mapper';

// Infrastructure Layer - Adapters (External Services)
import { BcryptPasswordAdapter } from './infrastructure/adapters/bcrypt-password.adapter';
import { JwtTokenGenerator } from './infrastructure/security/jwt-token-generator';
import { MailerEmailAdapter } from './infrastructure/adapters/mailer-email.adapter';

// Presentation Layer
import { AuthController } from './presentation/auth.controller';

// Legacy Components (will be phased out)

import { AuthApplicationService as LegacyAuthApplicationService } from './application/auth-application.service';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { VerificationTokenService } from './infrastructure/services/verification-token.service';
import { JwtStrategy } from './presentation/strategies/Jwt.strategy';
import { GoogleStrategy } from './presentation/strategies/google.strategy';

// Subscribers
import {
  UserRegisteredSubscriber,
  UserEmailVerifiedSubscriber,
  PasswordChangedSubscriber,
  UserLoggedInSubscriber,
} from './application/subscribers';

import { UsersModule } from '../users/users.module';
import { JWT } from 'src/config/jwt.config';
import { MailerModule } from '../mailer/mailer.module';
// import { NotificationModule } from '../notification/notification.module'; // TODO: Refactor notification module
import { RedisCacheModule } from '../cache/cache.module';
import { PrismaModule } from '../../database/prisma.module';

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
    // Persistence - Mappers
    UserMapper,

    // Persistence - Repositories
    {
      provide: SESSION_REPOSITORY_TOKEN,
      useClass: SessionRepository,
    },
    // Note: UserRepository is provided for Auth domain
    UserRepository,

    // Adapters - External Services
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordAdapter,
    },
    {
      provide: TOKEN_GENERATOR_TOKEN,
      useClass: JwtTokenGenerator,
    },
    {
      provide: EMAIL_SENDER_TOKEN,
      useClass: MailerEmailAdapter,
    },
    {
      provide: TOKEN_REPOSITORY_TOKEN,
      useClass: VerificationTokenService,
    },

    // Legacy/Compatibility
    {
      provide: 'LEGACY_AUTH_APPLICATION_SERVICE',
      useClass: LegacyAuthApplicationService,
    },

    // Legacy use-cases
    RegisterUserUseCase,
    LoginUseCase,
    GoogleAuthUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyEmailUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ResendVerificationUseCase,

    // Legacy infra
    VerificationTokenService,

    // Presentation
    JwtStrategy,
    GoogleStrategy,

    // Event Subscribers
    UserRegisteredSubscriber,
    UserEmailVerifiedSubscriber,
    PasswordChangedSubscriber,
    UserLoggedInSubscriber,

    // Compatibility token
    {
      provide: 'TOKEN_GENERATOR',
      useExisting: VerificationTokenService,
    },
  ],
  exports: [
    // Clean Architecture Exports
    SESSION_REPOSITORY_TOKEN,
    PASSWORD_HASHER_TOKEN,
    TOKEN_GENERATOR_TOKEN,
    EMAIL_SENDER_TOKEN,
    UserRepository, // Export the persistence repository
    UserMapper, // Export mapper for cross-module use

    // Legacy Exports (for backward compatibility)
    'LEGACY_AUTH_APPLICATION_SERVICE',
    'TOKEN_GENERATOR',
  ],
})
export class AuthModule {}
