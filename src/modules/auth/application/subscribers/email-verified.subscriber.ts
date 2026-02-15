import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailVerifiedEvent } from '../../domain/events';

/**
 * Email Verified Event Subscriber
 * Logs email verification events
 */
@Injectable()
export class EmailVerifiedSubscriber {
  @OnEvent('auth.email.verified')
  async handle(event: EmailVerifiedEvent): Promise<void> {
    try {
      console.log(
        `[EmailVerified] User ${event.userId} verified email: ${event.email}`,
      );

      // TODO: Send welcome email (implement queue in future)
      console.log(`[EmailVerified] Welcome email needed for: ${event.email}`);
    } catch (error) {
      console.error(
        '[EmailVerified] Error handling email verified event:',
        error,
      );
      // Don't throw - events should not fail the main flow
    }
  }
}
