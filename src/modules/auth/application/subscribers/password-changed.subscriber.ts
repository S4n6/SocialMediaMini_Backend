import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import { PasswordChangedEvent } from '../../domain/events';
import { IEmailService } from '../ports/i-email.service';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';

/**
 * Password Changed Subscriber
 * Handles side effects when a user changes their password
 */
@Injectable()
export class PasswordChangedSubscriber {
  constructor(
    @Inject(EMAIL_SENDER_TOKEN)
    private readonly emailService: IEmailService,
  ) {}

  @OnEvent('password.changed')
  async handlePasswordChanged(event: PasswordChangedEvent): Promise<void> {
    console.log(
      `[PasswordChangedSubscriber] Password changed for user: ${event.userId}`,
    );

    try {
      // Send password changed notification email
      const email = new Email(event.email);
      // Note: We need to get the username - for now, we'll use email as fallback
      const username = event.email.split('@')[0];
      await this.emailService.sendPasswordChangedEmail(email, username);

      console.log(
        `[PasswordChangedSubscriber] Password change notification sent to: ${event.email}`,
      );
    } catch (error) {
      console.error(
        `[PasswordChangedSubscriber] Failed to send notification email:`,
        error,
      );
    }
  }
}
