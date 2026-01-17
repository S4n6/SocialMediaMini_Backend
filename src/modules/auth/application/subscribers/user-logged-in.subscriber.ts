import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserLoggedInEvent } from '../../domain/events';

/**
 * User Logged In Subscriber
 * Handles side effects when a user logs in
 */
@Injectable()
export class UserLoggedInSubscriber {
  @OnEvent('user.logged_in')
  async handleUserLoggedIn(event: UserLoggedInEvent): Promise<void> {
    console.log(
      `[UserLoggedInSubscriber] User logged in: ${event.userId} from ${event.ipAddress}`,
    );

    try {
      // Future: Track login analytics, detect suspicious login patterns, etc.
      console.log(
        `[UserLoggedInSubscriber] Login tracked for user ${event.userId}`,
      );
    } catch (error) {
      console.error(
        `[UserLoggedInSubscriber] Error processing login event:`,
        error,
      );
    }
  }
}
