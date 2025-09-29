import { Injectable } from '@nestjs/common';
import { NotificationType } from '../../domain';

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  content: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

export interface IEmailNotificationService {
  sendNotificationEmail(payload: EmailNotificationPayload): Promise<boolean>;
  sendBulkNotificationEmails(
    payloads: EmailNotificationPayload[],
  ): Promise<boolean[]>;
}

/**
 * Mock implementation of email notification service
 * In production, this would integrate with services like SendGrid, AWS SES, etc.
 */
@Injectable()
export class EmailNotificationService implements IEmailNotificationService {
  async sendNotificationEmail(
    payload: EmailNotificationPayload,
  ): Promise<boolean> {
    try {
      console.log(`[EMAIL] Sending notification email to ${payload.to}`);
      console.log(`[EMAIL] Subject: ${payload.subject}`);
      console.log(`[EMAIL] Type: ${payload.type}`);
      console.log(`[EMAIL] Content: ${payload.content}`);

      // In production, integrate with actual email service
      // await this.emailProvider.send(payload);

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      console.error(
        `[EMAIL] Failed to send notification email to ${payload.to}:`,
        error,
      );
      return false;
    }
  }

  async sendBulkNotificationEmails(
    payloads: EmailNotificationPayload[],
  ): Promise<boolean[]> {
    console.log(
      `[EMAIL] Sending bulk notification emails (${payloads.length} emails)`,
    );

    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendNotificationEmail(payload)),
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : false,
    );
  }

  /**
   * Generate email template based on notification type
   */
  generateEmailTemplate(
    type: NotificationType,
    context: {
      recipientName?: string;
      actorName?: string;
      entityName?: string;
      appUrl?: string;
    },
  ): { subject: string; content: string } {
    const {
      recipientName = 'User',
      actorName = 'Someone',
      entityName = 'item',
      appUrl = '#',
    } = context;

    switch (type) {
      case NotificationType.FRIEND_REQUEST:
        return {
          subject: `${actorName} sent you a friend request`,
          content: `
            Hi ${recipientName},
            
            ${actorName} has sent you a friend request on our platform.
            
            Click here to view and respond: ${appUrl}/friends/requests
            
            Best regards,
            The Social Media Team
          `,
        };

      case NotificationType.MESSAGE:
        return {
          subject: `New message from ${actorName}`,
          content: `
            Hi ${recipientName},
            
            You have received a new message from ${actorName}.
            
            Click here to read the message: ${appUrl}/messages
            
            Best regards,
            The Social Media Team
          `,
        };

      case NotificationType.SYSTEM:
        return {
          subject: 'Important system notification',
          content: `
            Hi ${recipientName},
            
            You have received an important system notification.
            
            Click here to view: ${appUrl}/notifications
            
            Best regards,
            The Social Media Team
          `,
        };

      default:
        return {
          subject: 'New notification',
          content: `
            Hi ${recipientName},
            
            You have a new notification on our platform.
            
            Click here to view: ${appUrl}/notifications
            
            Best regards,
            The Social Media Team
          `,
        };
    }
  }
}
