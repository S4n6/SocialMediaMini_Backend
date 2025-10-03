import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  User,
  UserFactory,
  UserDomainService,
  IUserRepository,
  UserEmail,
  Username,
} from '../../domain';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { CreateUserDto } from '../dto';
import { UserResponseDto } from '../dto/user.dto';
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../users.module';

/**
 * Use case for creating a new user account
 * Follows Clean Architecture principles
 */
@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(
      `Creating user with username: ${dto.username}, email: ${dto.email}`,
    );

    // Create value objects for validation
    const email = UserEmail.create(dto.email);
    const username = Username.create(dto.username);

    // Validate business rules using domain service
    await this.userDomainService.validateUserUniqueness(email, username);

    // Create user using factory
    const user = await UserFactory.createUser({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      profile: {
        fullName: dto.fullName,
        bio: dto.bio,
        avatar: dto.avatar,
        location: dto.location,
        websiteUrl: dto.websiteUrl,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        phoneNumber: dto.phoneNumber,
        gender: dto.gender,
      },
    });

    // Save user
    await this.userRepository.save(user);

    // Publish domain events
    for (const event of user.domainEvents) {
      await this.eventBus.publish(event);
    }
    user.markEventsAsCommitted();

    this.logger.log(`User created successfully with ID: ${user.id}`);

    // Return response DTO
    return this.mapToResponseDto(user);
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      location: user.profile.location,
      websiteUrl: user.profile.websiteUrl,
      isEmailVerified: user.isEmailVerified,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
