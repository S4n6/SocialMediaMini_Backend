import { Injectable, Logger, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../users.constants';
import { User } from '../../domain';
import { IUserRepository } from '../../domain/repositories';
import { IEventBus } from '../../../../infrastructure/events';
import { DomainEventAdapter } from '../../infrastructure/adapters/event.adapter';
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
    // Save the updated user
    await this.userRepository.save(user);

    // Publish domain events
    const adaptedEvents = DomainEventAdapter.adaptAll(user.getDomainEvents());
    await this.eventBus.publishAll(adaptedEvents);
    user.clearDomainEvents();

    this.logger.log(`Email verified successfully for user: ${userId}`);
  }
}
