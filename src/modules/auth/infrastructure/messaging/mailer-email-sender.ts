import { Injectable } from '@nestjs/common';
import { IEmailSender } from '../../application/interfaces/email-sender.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { MailerService } from '../../../mailer/mailer.service';

/**
 * Mailer Email Sender Implementation
 * Implements IEmailSender using MailerService
 */
@Injectable()
export class MailerEmailSender implements IEmailSender {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    to: Email,
    verificationToken: string,
    userName: string,
  ): Promise<void> {
    await this.mailerService.sendEmailVerification(
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
    // This would need to be implemented in MailerService
    // For now, we'll just log it
    console.log(`Welcome email would be sent to ${to.value} for ${userName}`);
  }

  async sendLoginNotificationEmail(
    to: Email,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // This would need to be implemented in MailerService
    console.log(
      `Login notification would be sent to ${to.value} for ${userName}`,
    );
  }

  async sendPasswordChangedEmail(to: Email, userName: string): Promise<void> {
    // This would need to be implemented in MailerService
    console.log(
      `Password changed notification would be sent to ${to.value} for ${userName}`,
    );
  }

  async sendAccountLockedEmail(to: Email, userName: string): Promise<void> {
    // This would need to be implemented in MailerService
    console.log(
      `Account locked notification would be sent to ${to.value} for ${userName}`,
    );
  }
}
