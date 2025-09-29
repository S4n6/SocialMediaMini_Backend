import { Injectable, Logger } from '@nestjs/common';
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
    private readonly userRepository: IUserRepository,
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
