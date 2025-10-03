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

// Repository interface token
export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY';
export const EVENT_BUS_TOKEN = 'EVENT_BUS';

@Module({
  imports: [PrismaModule],
  controllers: [
    // UsersController, // temporarily disabled
  ],
  providers: [
    // Application Layer
    // UserApplicationService, // Temporarily disabled

    // Use Cases - User Management
    // CreateUserUseCase, // Temporarily disabled
    // UpdateProfileUseCase,
    // VerifyEmailUseCase,

    // Use Cases - Follow Management
    // FollowUserUseCase,
    // UnfollowUserUseCase,

    // Use Cases - User Queries
    // GetUserProfileUseCase,
    // SearchUsersUseCase,
    // GetUserFollowersUseCase,
    // GetUserFollowingUseCase,

    // Domain Layer
    UserFactory,
    UserDomainService,

    // Infrastructure Layer - Repository
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserPrismaRepository,
    },

    // Event Bus
    {
      provide: EVENT_BUS_TOKEN,
      useClass: InMemoryEventBus,
    },
  ],
  exports: [
    // UserApplicationService, // Temporarily disabled
    USER_REPOSITORY_TOKEN, // Export for other modules to use
    UserFactory, // Export for other modules to use
    UserDomainService,
    EVENT_BUS_TOKEN, // Export event bus for other modules
  ],
})
export class UsersModule {}
