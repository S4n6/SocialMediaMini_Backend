import { Inject, Injectable } from '@nestjs/common';
import { IEmailService } from '../../application/ports/i-email.service';
import { Email } from '../../domain/value-objects/email.vo';
import { MailerService } from '../../../mailer/mailer.service';

/**
 * Mailer Email Adapter
 * Implements IEmailService using MailerService
 */
@Injectable()
export class MailerEmailAdapter implements IEmailService {
  constructor(
    @Inject()
    private readonly mailerService: MailerService,
  ) {}

  async sendVerificationEmail(
    to: Email,
    verificationToken: string,
    userName: string,
  ): Promise<void> {
    console.log(
      'Sending verification email to:',
      to.value,
      userName,
      verificationToken,
    );
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
    console.log(`Welcome email would be sent to ${to.value} for ${userName}`);
    // TODO: Implement in MailerService
  }

  async sendLoginNotificationEmail(
    to: Email,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    console.log(
      `Login notification would be sent to ${to.value} for ${userName} from ${ipAddress}`,
    );
    // TODO: Implement in MailerService
  }

  async sendPasswordChangedEmail(to: Email, userName: string): Promise<void> {
    console.log(
      `Password changed notification would be sent to ${to.value} for ${userName}`,
    );
    // TODO: Implement in MailerService
  }
}
