/**
 * Users Module
 *
 * Handles user identity, authentication, and profile management following Clean Architecture principles.
 *
 * Responsibilities:
 * - User registration and authentication
 * - Profile management (create, read, update)
 * - Email verification
 * - User search
 * - Read-only follow counts (followersCount, followingCount)
 *
 * Architecture:
 * - Domain Layer: User entity with business logic, value objects, domain events
 * - Application Layer: Use cases, DTOs, application services
 * - Infrastructure Layer: Prisma repositories, adapters
 * - Presentation Layer: REST controllers, request/response DTOs
 *
 * Note: Follow/unfollow operations are handled by the Follow module.
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IEventBus, InMemoryEventBus } from '../../infrastructure/events';

// Domain Layer
import { UserFactory } from './domain/factories/user.factory';

// Application Layer - Use Cases
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import {
  GetUserProfileUseCase,
  SearchUsersUseCase,
} from './application/use-cases/get-user.use-case';
import {
  FindUserByCredentialsUseCase,
  FindUserByIdUseCase,
  FindUserByEmailUseCase,
  CheckUserExistenceUseCase,
} from './application/use-cases/auth-integration.use-case';
import {
  UpdateUserPasswordUseCase,
  CreateUserFromGoogleUseCase,
  UpdateVerificationTimestampUseCase,
  UpdatePasswordResetTimestampUseCase,
  SaveUserUseCase,
} from './application/use-cases/user-management.use-case';

// Application Layer - Service
import { UserApplicationService } from './application/user-application.service';

// Infrastructure Layer - Persistence
import { UserPrismaRepository } from './infrastructure/persistence/repositories/user.repository';

// Presentation Layer
import { UsersController } from './presentation/controllers/users.controller';

// DI Tokens
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from './users.constants';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    // Domain Layer
    UserFactory,

    // Infrastructure - Persistence (Repositories)
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserPrismaRepository,
    },

    // Infrastructure - Event Bus
    {
      provide: EVENT_BUS_TOKEN,
      useClass: InMemoryEventBus,
    },

    // Application Layer - Service
    UserApplicationService,

    // Application Layer - Use Cases (User Management)
    CreateUserUseCase,
    UpdateProfileUseCase,
    VerifyEmailUseCase,

    // Application Layer - Use Cases (Queries)
    GetUserProfileUseCase,
    SearchUsersUseCase,

    // Application Layer - Use Cases (Auth Integration)
    FindUserByCredentialsUseCase,
    FindUserByIdUseCase,
    FindUserByEmailUseCase,
    CheckUserExistenceUseCase,
    UpdateUserPasswordUseCase,
    CreateUserFromGoogleUseCase,
    UpdateVerificationTimestampUseCase,
    UpdatePasswordResetTimestampUseCase,
    SaveUserUseCase,
  ],
  exports: [
    // Repository Token (for cross-module use)
    USER_REPOSITORY_TOKEN,

    // Application Service
    UserApplicationService,

    // Domain Factory
    UserFactory,

    // Event Bus
    EVENT_BUS_TOKEN,
  ],
})
export class UsersModule {}
