import { Injectable, Logger } from '@nestjs/common';
import {
  ReactionCreatedEvent,
  ReactionUpdatedEvent,
  ReactionRemovedEvent,
  ReactionEvents,
} from '../../domain/reaction.events';

/**
 * Base event handler for reaction domain events
 */
@Injectable()
export abstract class BaseReactionEventHandler<T extends ReactionEvents> {
  protected readonly logger = new Logger(this.constructor.name);

  abstract handle(event: T): Promise<void>;

  protected logEvent(event: T, action: string): void {
    this.logger.debug(`${action} - Event: ${event.eventName}`, {
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
      reactionId: event.reaction.id,
      reactorId: event.reaction.reactorId,
      targetId: event.reaction.targetId,
      targetType: event.reaction.targetType,
    });
  }
}

/**
 * Handles reaction created events
 */
@Injectable()
export class ReactionCreatedEventHandler extends BaseReactionEventHandler<ReactionCreatedEvent> {
  async handle(event: ReactionCreatedEvent): Promise<void> {
    this.logEvent(event, 'Handling reaction created');

    try {
      // Update reaction statistics
      await this.updateReactionStats(event);

      // Update user activity
      await this.updateUserActivity(event);

      // Trigger analytics
      await this.triggerAnalytics(event);

      this.logger.debug('Successfully handled reaction created event', {
        reactionId: event.reaction.id,
      });
    } catch (error) {
      this.logger.error('Failed to handle reaction created event', {
        error: error.message,
        reactionId: event.reaction.id,
        stack: error.stack,
      });
      // Depending on requirements, might want to re-throw or handle gracefully
    }
  }

  private async updateReactionStats(
    event: ReactionCreatedEvent,
  ): Promise<void> {
    // Implementation would update statistics in cache/database
    this.logger.debug('Updating reaction statistics', {
      targetId: event.reaction.targetId,
      reactionType: event.reaction.type,
    });
  }

  private async updateUserActivity(event: ReactionCreatedEvent): Promise<void> {
    // Implementation would update user activity metrics
    this.logger.debug('Updating user activity', {
      userId: event.reaction.reactorId,
    });
  }

  private async triggerAnalytics(event: ReactionCreatedEvent): Promise<void> {
    // Implementation would send analytics events
    this.logger.debug('Triggering analytics', {
      event: 'reaction_created',
      reactionType: event.reaction.type,
      targetType: event.reaction.targetType,
    });
  }
}

/**
 * Handles reaction updated events
 */
@Injectable()
export class ReactionUpdatedEventHandler extends BaseReactionEventHandler<ReactionUpdatedEvent> {
  async handle(event: ReactionUpdatedEvent): Promise<void> {
    this.logEvent(event, 'Handling reaction updated');

    try {
      // Update reaction statistics (decrement old, increment new)
      await this.updateReactionStats(event);

      // Trigger analytics
      await this.triggerAnalytics(event);

      this.logger.debug('Successfully handled reaction updated event', {
        reactionId: event.reaction.id,
        previousType: event.previousType.getValue(),
        newType: event.newType.getValue(),
      });
    } catch (error) {
      this.logger.error('Failed to handle reaction updated event', {
        error: error.message,
        reactionId: event.reaction.id,
        stack: error.stack,
      });
    }
  }

  private async updateReactionStats(
    event: ReactionUpdatedEvent,
  ): Promise<void> {
    this.logger.debug('Updating reaction statistics for type change', {
      targetId: event.reaction.targetId,
      previousType: event.previousType.getValue(),
      newType: event.newType.getValue(),
    });
  }

  private async triggerAnalytics(event: ReactionUpdatedEvent): Promise<void> {
    this.logger.debug('Triggering analytics for reaction update', {
      event: 'reaction_updated',
      previousType: event.previousType.getValue(),
      newType: event.newType.getValue(),
    });
  }
}

/**
 * Handles reaction removed events
 */
@Injectable()
export class ReactionRemovedEventHandler extends BaseReactionEventHandler<ReactionRemovedEvent> {
  async handle(event: ReactionRemovedEvent): Promise<void> {
    this.logEvent(event, 'Handling reaction removed');

    try {
      // Update reaction statistics
      await this.updateReactionStats(event);

      // Trigger analytics
      await this.triggerAnalytics(event);

      this.logger.debug('Successfully handled reaction removed event', {
        reactionId: event.reaction.id,
      });
    } catch (error) {
      this.logger.error('Failed to handle reaction removed event', {
        error: error.message,
        reactionId: event.reaction.id,
        stack: error.stack,
      });
    }
  }

  private async updateReactionStats(
    event: ReactionRemovedEvent,
  ): Promise<void> {
    this.logger.debug('Updating reaction statistics for removal', {
      targetId: event.reaction.targetId,
      reactionType: event.reaction.type,
    });
  }

  private async triggerAnalytics(event: ReactionRemovedEvent): Promise<void> {
    this.logger.debug('Triggering analytics for reaction removal', {
      event: 'reaction_removed',
      reactionType: event.reaction.type,
      targetType: event.reaction.targetType,
    });
  }
}
