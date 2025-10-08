import { Injectable, Logger, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../users.constants';
import { User } from '../../domain';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

/**
 * Use case for verifying user email
 */
@Injectable()
export class VerifyEmailUseCase {
  private readonly logger = new Logger(VerifyEmailUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(userId: string): Promise<void> {
    this.logger.log(`Verifying email for user: ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    // Execute domain logic
    user.verifyEmail();

    // Save changes
    const updatedUser = await this.userRepository.save(user);

    // Publish domain events
    await this.eventBus.publishAll(updatedUser.domainEvents);
    updatedUser.clearEvents();

    this.logger.log(`Email verified successfully for user: ${userId}`);
  }
}
