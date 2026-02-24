/**
 * Mailer Module - Email Type Constants
 *
 * Email type constants are kept in sync with the Go worker's
 * `internal/tasks/email/types.go` — any change here MUST be
 * mirrored there (and vice-versa).
 *
 * DI tokens and task types are now in the shared messaging module:
 * `src/infrastructure/message-queue/message-queue.constants.ts`
 */

// ── Email Type Constants (must match Go worker) ─────────────
export const EMAIL_TYPES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  LOGIN_NOTIFICATION: 'login_notification',
  PASSWORD_CHANGED: 'password_changed',
} as const;

export type EmailType = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES];

// ── Default Subjects ────────────────────────────────────────
export const DEFAULT_SUBJECTS: Record<EmailType, string> = {
  [EMAIL_TYPES.WELCOME]: 'Welcome to Social Media Mini! 🎉',
  [EMAIL_TYPES.EMAIL_VERIFICATION]: 'Verify Your Email - Social Media Mini',
  [EMAIL_TYPES.PASSWORD_RESET]: 'Reset Your Password - Social Media Mini',
  [EMAIL_TYPES.LOGIN_NOTIFICATION]: 'New Login Detected - Social Media Mini',
  [EMAIL_TYPES.PASSWORD_CHANGED]:
    'Password Changed Successfully - Social Media Mini',
};
