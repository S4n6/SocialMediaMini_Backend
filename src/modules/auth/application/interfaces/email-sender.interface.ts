import { Email } from '../../domain/value-objects/email.vo';

/**
 * Email Sender Interface - Domain Layer
 * Contract for email sending operations
 */
export interface IEmailSender {
  /**
   * Send verification email
   */
  sendVerificationEmail(
    to: Email,
    verificationToken: string,
    userName: string,
  ): Promise<void>;

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(
    to: Email,
    resetToken: string,
    userName: string,
  ): Promise<void>;

  /**
   * Send welcome email after successful registration
   */
  sendWelcomeEmail(to: Email, userName: string): Promise<void>;

  /**
   * Send login notification email
   */
  sendLoginNotificationEmail(
    to: Email,
    userName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void>;

  /**
   * Send password changed confirmation email
   */
  sendPasswordChangedEmail(to: Email, userName: string): Promise<void>;

  /**
   * Send account locked notification email
   */
  sendAccountLockedEmail(to: Email, userName: string): Promise<void>;
}
