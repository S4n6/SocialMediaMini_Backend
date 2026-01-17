import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import { UserRegisteredEvent } from '../../domain/events';
import { IEmailService } from '../ports/i-email.service';
import { EMAIL_SENDER_TOKEN } from '../../auth.constants';
import { Email } from '../../domain/value-objects/email.vo';

/**
 * User Registered Subscriber
 * Handles side effects when a new user registers
 */
@Injectable()
export class UserRegisteredSubscriber {
  constructor(
    @Inject(EMAIL_SENDER_TOKEN)
    private readonly emailService: IEmailService,
  ) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    console.log(
      `[UserRegisteredSubscriber] Handling registration for user: ${event.userId}`,
    );

    try {
      // Send welcome email
      const email = new Email(event.email);
      await this.emailService.sendWelcomeEmail(email, event.fullName);

      console.log(
        `[UserRegisteredSubscriber] Welcome email sent to: ${event.email}`,
      );
    } catch (error) {
      console.error(
        `[UserRegisteredSubscriber] Failed to send welcome email:`,
        error,
      );
      // Don't throw - we don't want email failures to break registration
    }
  }
}
