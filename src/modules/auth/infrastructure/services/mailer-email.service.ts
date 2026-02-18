import { Inject, Injectable } from '@nestjs/common';
import { IEmailSender } from '../../domain/repositories/email-sender.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { MailerService } from '../../../mailer/mailer.service';

/**
 * Mailer Email Sender Implementation
 *
 * Implements the auth domain's IEmailSender by delegating to
 * MailerService, which publishes tasks to RabbitMQ.
 * The Go worker handles rendering + delivery.
 */
@Injectable()
export class MailerEmailSender implements IEmailSender {
  constructor(
    @Inject()
    private readonly mailerService: MailerService,
  ) {}

  async sendVerificationEmail(
    to: Email,
    userName: string,
    verificationToken: string,
  ): Promise<void> {
    await this.mailerService.sendVerificationEmail(
      to.value,
      userName,
      verificationToken,
    );
  }

  async sendPasswordResetEmail(
    to: Email,
    resetToken: string,
    userName: string,
  ): Promise<void> {
    await this.mailerService.sendPasswordResetEmail({
      email: to.value,
      resetToken,
      username: userName,
    });
  }

  async sendWelcomeEmail(to: Email, userName: string): Promise<void> {
    await this.mailerService.sendWelcomeEmail(to.value, userName);
  }

  async sendLoginNotificationEmail(
    to: Email,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.mailerService.sendLoginNotificationEmail(
      to.value,
      userName,
      ipAddress,
      userAgent,
    );
  }

  async sendPasswordChangedEmail(to: Email, userName: string): Promise<void> {
    await this.mailerService.sendPasswordChangedEmail(to.value, userName);
  }
}
