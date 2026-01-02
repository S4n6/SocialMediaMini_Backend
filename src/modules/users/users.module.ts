import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IEventBus } from '../../infrastructure/events';
import { InMemoryEventBus } from '../../infrastructure/events';

// Clean Architecture imports
import { UserApplicationService } from './application/user-application.service';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FollowUserUseCase } from './application/use-cases/follow-user.use-case';
import { UserPrismaRepository } from './infrastructure/user.prisma.repository';
import { UserFactory } from './domain/factories/user.factory';
// import { UserDomainService } from './domain/services/user-domain.service'; // Moved to .old

// Core use cases
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import {
  GetUserProfileUseCase,
  SearchUsersUseCase,
  GetUserFollowersUseCase,
  GetUserFollowingUseCase,
} from './application/use-cases/get-user.use-case';
import { UnfollowUserUseCase } from './application/use-cases/follow-user.use-case';

// Auth integration use cases
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
  SaveUserUseCase,
} from './application/use-cases/user-management.use-case';

// Presentation Layer
import { UsersController } from './presentation/users.controller';

// Infrastructure Layer
// import { UserInfrastructureService } from './infrastructure/user-infrastructure.service'; // Moved to .old

// Repository / event tokens
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from './users.constants';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    // Infrastructure Layer - Repository (provide early)
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserPrismaRepository,
    },

    // Event Bus (provide early)
    {
      provide: EVENT_BUS_TOKEN,
      useClass: InMemoryEventBus,
    },

    // Domain Layer
    UserFactory,

    // Application Layer
    UserApplicationService,

    // Use Cases - User Management
    CreateUserUseCase,
    UpdateProfileUseCase,
    VerifyEmailUseCase,

    // Use Cases - Follow Management
    FollowUserUseCase,
    UnfollowUserUseCase,

    // Use Cases - User Queries
    GetUserProfileUseCase,
    SearchUsersUseCase,
    GetUserFollowersUseCase,
    GetUserFollowingUseCase,

    // Use Cases - Auth Integration
    FindUserByCredentialsUseCase,
    FindUserByIdUseCase,
    FindUserByEmailUseCase,
    CheckUserExistenceUseCase,
    UpdateUserPasswordUseCase,
    CreateUserFromGoogleUseCase,
    UpdateVerificationTimestampUseCase,
    SaveUserUseCase,
  ],
  exports: [
    UserApplicationService,
    USER_REPOSITORY_TOKEN,
    UserFactory,
    EVENT_BUS_TOKEN,
  ],
})
export class UsersModule {}
