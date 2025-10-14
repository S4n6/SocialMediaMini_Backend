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
import { AuthApplicationService } from './application/services/auth.service';

// Infrastructure Layer - Repository Implementations
import { SessionRepository } from './infrastructure/repositories/session.repository';
import { TokenRepository } from './infrastructure/repositories/token.repository';

// Infrastructure Layer - Service Implementations
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenGenerator } from './infrastructure/security/jwt-token-generator';
import { MailerEmailSender } from './infrastructure/services/mailer-email.service';

// Presentation Layer
import { AuthController } from './presentation/auth.controller';

// Legacy Components (will be phased out)
import { AuthUserService } from './application/auth-user.service';
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
import { AuthenticationService } from './infrastructure/repositories/authentication.repository';
import { VerificationTokenService } from './infrastructure/services/verification-token.service';
import { JwtStrategy } from './presentation/strategies/Jwt.strategy';
import { GoogleStrategy } from './presentation/strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { JWT } from 'src/config/jwt.config';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationModule } from '../notification/notification.module';
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
    NotificationModule,
    RedisCacheModule,
  ],
  controllers: [AuthController],
  providers: [
    // Application
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

    // Legacy/Compatibility
    {
      provide: 'LEGACY_AUTH_APPLICATION_SERVICE',
      useClass: LegacyAuthApplicationService,
    },
    AuthUserService,
    {
      provide: 'AUTH_USER_SERVICE',
      useExisting: AuthUserService,
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
    AuthenticationService,
    {
      provide: 'AUTHENTICATION_SERVICE',
      useExisting: AuthenticationService,
    },
    VerificationTokenService,

    // Presentation
    JwtStrategy,
    GoogleStrategy,

    // Compatibility token
    {
      provide: 'TOKEN_GENERATOR',
      useExisting: VerificationTokenService,
    },
  ],
  exports: [
    // New Clean Architecture Exports
    AuthApplicationService,
    SESSION_REPOSITORY_TOKEN,
    TOKEN_REPOSITORY_TOKEN,
    PASSWORD_HASHER_TOKEN,
    TOKEN_GENERATOR_TOKEN,
    EMAIL_SENDER_TOKEN,

    // Legacy Exports (for backward compatibility)
    'LEGACY_AUTH_APPLICATION_SERVICE',
    AuthUserService,
    'TOKEN_GENERATOR',
    'AUTHENTICATION_SERVICE',
    // Removed: PassportAuthAdapter (file was deleted)
  ],
})
export class AuthModule {}
