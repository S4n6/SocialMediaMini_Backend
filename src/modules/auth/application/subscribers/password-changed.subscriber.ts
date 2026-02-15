import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PasswordChangedEvent } from '../../domain/events';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { SESSION_REPOSITORY_TOKEN } from '../../auth.constants';

/**
 * Password Changed Event Subscriber
 * Handles CRITICAL side effects immediately (session revocation)
 */
@Injectable()
export class PasswordChangedSubscriber {
  constructor(
    @Inject(SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepository: ISessionRepository,
  ) {}

  @OnEvent('auth.password.changed')
  async handle(event: PasswordChangedEvent): Promise<void> {
    try {
      // 1. CRITICAL: Revoke all user sessions immediately (force re-login for security)
      console.log(
        `[PasswordChanged] Revoking all sessions for user: ${event.userId}`,
      );
      await this.sessionRepository.deleteAllByUserId(event.userId);

      // 2. TODO: Send password changed notification email (implement queue in future)
      console.log(
        `[PasswordChanged] Password changed notification needed for: ${event.email}`,
      );
    } catch (error) {
      console.error(
        '[PasswordChanged] Error handling password changed event:',
        error,
      );
      // Don't throw - events should not fail the main flow
    }
  }
}
