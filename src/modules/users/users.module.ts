import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IEventBus } from '../../shared/events/event-bus.interface';
import { InMemoryEventBus } from '../../shared/events/in-memory-event-bus.service';

// Clean Architecture imports
import { UserApplicationService } from './application/user-application.service';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FollowUserUseCase } from './application/use-cases/follow-user.use-case';
import { UserPrismaRepository } from './infrastructure/user.prisma.repository';
import { UserFactory } from './domain/factories/user.factory';
import { UserDomainService } from './domain/services/user-domain.service';

// Additional use cases
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import {
  GetUserProfileUseCase,
  SearchUsersUseCase,
  GetUserFollowersUseCase,
  GetUserFollowingUseCase,
} from './application/use-cases/get-user.use-case';
import { UnfollowUserUseCase } from './application/use-cases/follow-user.use-case';

// Presentation Layer
import { UsersController } from './presentation/users.controller';

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
    UserDomainService,

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
  ],
  exports: [
    UserApplicationService,
    USER_REPOSITORY_TOKEN, // Export for other modules to use
    UserFactory, // Export for other modules to use
    UserDomainService,
    EVENT_BUS_TOKEN, // Export event bus for other modules
  ],
})
export class UsersModule {}
