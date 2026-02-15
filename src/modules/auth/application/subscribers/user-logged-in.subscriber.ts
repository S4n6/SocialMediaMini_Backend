import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserLoggedInEvent } from '../../domain/events';

/**
 * User Logged In Event Subscriber
 * Handles side effects when a user logs in
 */
@Injectable()
export class UserLoggedInSubscriber {
  @OnEvent('auth.user.logged-in')
  async handle(event: UserLoggedInEvent): Promise<void> {
    try {
      console.log(
        `[UserLoggedIn] User ${event.userId} logged in from IP: ${event.ipAddress}`,
      );

      // Here you could:
      // 1. Update lastLoginAt timestamp (already handled in use case)
      // 2. Log audit trail to security log
      // 3. Check for suspicious login patterns
      // 4. Send login notification email if from new device

      // For now, just logging
    } catch (error) {
      console.error(
        '[UserLoggedIn] Error handling user logged in event:',
        error,
      );
      // Don't throw - events should not fail the main flow
    }
  }
}
