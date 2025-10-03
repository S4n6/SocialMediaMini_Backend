import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Application Layer
import { AuthApplicationService } from './application/auth-application.service';
import { AuthUserService } from './application/auth-user.service';

// Use Cases
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';

// Infrastructure Layer
// import { UserManagementService } from './infrastructure/user-management.repository'; // Removed - using shared repository
import { AuthenticationService } from './infrastructure/authentication.repository';
import { SessionService } from './infrastructure/session.repository';
import { TokenService } from './infrastructure/token.repository';

// Presentation Layer
import { AuthController } from './presentation/auth.controller';
import { JwtStrategy } from './presentation/strategies/Jwt.strategy';
import { GoogleStrategy } from './presentation/strategies/google.strategy';

// External Dependencies
import { UsersModule, USER_REPOSITORY_TOKEN } from '../users/users.module';
import { UserFactory } from '../users/domain/factories/user.factory';
import { JWT } from 'src/config/jwt.config';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationModule } from '../notification/notification.module';
import { RedisCacheModule } from '../cache/cache.module';
import { PrismaModule } from '../../database/prisma.module';

// Repository interface tokens (USER_REPOSITORY_TOKEN now imported from UsersModule)
export const TOKEN_REPOSITORY_TOKEN = 'TOKEN_REPOSITORY';
export const SESSION_REPOSITORY_TOKEN = 'SESSION_REPOSITORY';

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
    // Application Layer
    AuthApplicationService,
    AuthUserService, // Auth-specific user service wrapper

    // Use Cases
    RegisterUserUseCase,
    LoginUseCase,
    GoogleAuthUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyEmailUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,

    // Infrastructure services - Direct providers
    SessionService,
    TokenService,

    // Infrastructure Layer - Repository implementations
    // Use shared repository from UsersModule instead of duplicate UserManagementService
    {
      provide: TOKEN_REPOSITORY_TOKEN,
      useClass: TokenService,
    },
    {
      provide: SESSION_REPOSITORY_TOKEN,
      useExisting: SessionService, // Use existing SessionService instance
    },

    // Legacy services (to be refactored gradually)
    AuthenticationService,

    // Presentation Layer - Now using direct repository access
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthApplicationService,
    // USER_REPOSITORY_TOKEN, // Now provided by UsersModule
    TOKEN_REPOSITORY_TOKEN,
    SESSION_REPOSITORY_TOKEN,
    AuthenticationService, // Legacy export
  ],
})
export class AuthModule {}
