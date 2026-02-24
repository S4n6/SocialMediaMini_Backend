// src/modules/mailer/mailer.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IMessagePublisher } from '../../infrastructure/message-queue/ports/i-message-publisher.port';
import {
  MESSAGE_PUBLISHER_TOKEN,
  TASK_TYPE_SEND_EMAIL,
} from '../../infrastructure/message-queue/message-queue.constants';
import {
  EMAIL_TYPES,
  DEFAULT_SUBJECTS,
  type EmailType,
} from './mailer.constants';

/**
 * Mailer Service
 *
 * Publishes email tasks to the message queue (RabbitMQ).
 * The actual rendering and delivery is handled by the Go worker.
 *
 * Every message follows the envelope format expected by the worker:
 * ```json
 * { "type": "send_email", "payload": { "email_type": "...", ... } }
 * ```
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    @Inject(MESSAGE_PUBLISHER_TOKEN)
    private readonly publisher: IMessagePublisher,
  ) {}

  // ── Public API ──────────────────────────────────────────────

  async sendVerificationEmail(
    to: string,
    username: string,
    token: string,
  ): Promise<void> {
    await this.publishEmailTask(EMAIL_TYPES.EMAIL_VERIFICATION, {
      to,
      username,
      token,
    });
  }

  async sendPasswordResetEmail(params: {
    email: string;
    username: string;
    resetToken: string;
  }): Promise<void> {
    await this.publishEmailTask(EMAIL_TYPES.PASSWORD_RESET, {
      to: params.email,
      username: params.username,
      token: params.resetToken,
    });
  }

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    await this.publishEmailTask(EMAIL_TYPES.WELCOME, {
      to,
      username,
    });
  }

  async sendLoginNotificationEmail(
    to: string,
    username: string,
    loginIp?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.publishEmailTask(EMAIL_TYPES.LOGIN_NOTIFICATION, {
      to,
      username,
      login_ip: loginIp,
      login_time: new Date().toISOString(),
      user_agent: userAgent,
    });
  }

  async sendPasswordChangedEmail(to: string, username: string): Promise<void> {
    await this.publishEmailTask(EMAIL_TYPES.PASSWORD_CHANGED, {
      to,
      username,
    });
  }

  // ── Internal ────────────────────────────────────────────────

  /**
   * Build the message envelope and publish to the queue.
   */
  private async publishEmailTask(
    emailType: EmailType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const message = {
      type: TASK_TYPE_SEND_EMAIL,
      payload: {
        email_type: emailType,
        subject: DEFAULT_SUBJECTS[emailType],
        ...payload,
      },
    };

    try {
      await this.publisher.publish(message);
      this.logger.log(
        `Email task published: ${emailType} → ${payload.to as string}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish email task: ${emailType} → ${payload.to as string}`,
        error,
      );
      throw error;
    }
  }
}
