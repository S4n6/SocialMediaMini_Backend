import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEmailVerifiedEvent } from '../../domain/events';

/**
 * User Email Verified Subscriber
 * Handles side effects when a user verifies their email
 */
@Injectable()
export class UserEmailVerifiedSubscriber {
  @OnEvent('user.email_verified')
  async handleEmailVerified(event: UserEmailVerifiedEvent): Promise<void> {
    console.log(
      `[UserEmailVerifiedSubscriber] Email verified for user: ${event.userId}`,
    );

    try {
      // Future: Send analytics event, update user onboarding status, etc.
      // For now, just log the event
      console.log(
        `[UserEmailVerifiedSubscriber] User ${event.userId} completed email verification`,
      );
    } catch (error) {
      console.error(
        `[UserEmailVerifiedSubscriber] Error processing email verification:`,
        error,
      );
    }
  }
}
