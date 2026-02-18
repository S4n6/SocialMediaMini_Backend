import { MailerService } from './mailer.service';
import { IMessagePublisher } from './ports/i-message-publisher.port';
import {
  EMAIL_TYPES,
  DEFAULT_SUBJECTS,
  TASK_TYPE_SEND_EMAIL,
} from './mailer.constants';

/**
 * Helper: create a mock IMessagePublisher for testing.
 */
function createMockPublisher(): jest.Mocked<IMessagePublisher> {
  return {
    publish: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

describe('MailerService', () => {
  let service: MailerService;
  let publisher: jest.Mocked<IMessagePublisher>;

  beforeEach(() => {
    publisher = createMockPublisher();
    service = new MailerService(publisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── sendVerificationEmail ───────────────────────────────────

  describe('sendVerificationEmail', () => {
    const to = 'user@example.com';
    const username = 'johndoe';
    const token = 'verify-token-123';

    it('should publish an email_verification task with correct payload', async () => {
      await service.sendVerificationEmail(to, username, token);

      expect(publisher.publish).toHaveBeenCalledTimes(1);
      expect(publisher.publish).toHaveBeenCalledWith({
        type: TASK_TYPE_SEND_EMAIL,
        payload: {
          email_type: EMAIL_TYPES.EMAIL_VERIFICATION,
          subject: DEFAULT_SUBJECTS[EMAIL_TYPES.EMAIL_VERIFICATION],
          to,
          username,
          token,
        },
      });
    });

    it('should throw when publisher rejects', async () => {
      publisher.publish.mockRejectedValueOnce(new Error('RabbitMQ down'));

      await expect(
        service.sendVerificationEmail(to, username, token),
      ).rejects.toThrow('RabbitMQ down');
    });
  });

  // ── sendPasswordResetEmail ──────────────────────────────────

  describe('sendPasswordResetEmail', () => {
    const params = {
      email: 'user@example.com',
      username: 'johndoe',
      resetToken: 'reset-token-456',
    };

    it('should publish a password_reset task with correct payload', async () => {
      await service.sendPasswordResetEmail(params);

      expect(publisher.publish).toHaveBeenCalledWith({
        type: TASK_TYPE_SEND_EMAIL,
        payload: {
          email_type: EMAIL_TYPES.PASSWORD_RESET,
          subject: DEFAULT_SUBJECTS[EMAIL_TYPES.PASSWORD_RESET],
          to: params.email,
          username: params.username,
          token: params.resetToken,
        },
      });
    });

    it('should throw when publisher rejects', async () => {
      publisher.publish.mockRejectedValueOnce(new Error('Channel closed'));

      await expect(service.sendPasswordResetEmail(params)).rejects.toThrow(
        'Channel closed',
      );
    });
  });

  // ── sendWelcomeEmail ────────────────────────────────────────

  describe('sendWelcomeEmail', () => {
    it('should publish a welcome task', async () => {
      await service.sendWelcomeEmail('new@user.com', 'newuser');

      expect(publisher.publish).toHaveBeenCalledWith({
        type: TASK_TYPE_SEND_EMAIL,
        payload: {
          email_type: EMAIL_TYPES.WELCOME,
          subject: DEFAULT_SUBJECTS[EMAIL_TYPES.WELCOME],
          to: 'new@user.com',
          username: 'newuser',
        },
      });
    });
  });

  // ── sendLoginNotificationEmail ──────────────────────────────

  describe('sendLoginNotificationEmail', () => {
    it('should publish a login_notification task with optional fields', async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      await service.sendLoginNotificationEmail(
        'user@example.com',
        'johndoe',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(publisher.publish).toHaveBeenCalledWith({
        type: TASK_TYPE_SEND_EMAIL,
        payload: {
          email_type: EMAIL_TYPES.LOGIN_NOTIFICATION,
          subject: DEFAULT_SUBJECTS[EMAIL_TYPES.LOGIN_NOTIFICATION],
          to: 'user@example.com',
          username: 'johndoe',
          login_ip: '192.168.1.1',
          login_time: now.toISOString(),
          user_agent: 'Mozilla/5.0',
        },
      });

      jest.useRealTimers();
    });

    it('should publish with undefined optional fields when not provided', async () => {
      jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });

      await service.sendLoginNotificationEmail('user@example.com', 'johndoe');

      expect(publisher.publish).toHaveBeenCalledWith({
        type: TASK_TYPE_SEND_EMAIL,
        payload: expect.objectContaining({
          email_type: EMAIL_TYPES.LOGIN_NOTIFICATION,
          to: 'user@example.com',
          username: 'johndoe',
          login_ip: undefined,
          user_agent: undefined,
        }),
      });

      jest.useRealTimers();
    });
  });

  // ── sendPasswordChangedEmail ────────────────────────────────

  describe('sendPasswordChangedEmail', () => {
    it('should publish a password_changed task', async () => {
      await service.sendPasswordChangedEmail('user@example.com', 'johndoe');

      expect(publisher.publish).toHaveBeenCalledWith({
        type: TASK_TYPE_SEND_EMAIL,
        payload: {
          email_type: EMAIL_TYPES.PASSWORD_CHANGED,
          subject: DEFAULT_SUBJECTS[EMAIL_TYPES.PASSWORD_CHANGED],
          to: 'user@example.com',
          username: 'johndoe',
        },
      });
    });
  });

  // ── Edge cases ──────────────────────────────────────────────

  describe('error propagation', () => {
    it('should propagate the original error from publisher', async () => {
      const originalError = new Error('Connection refused');
      publisher.publish.mockRejectedValueOnce(originalError);

      await expect(
        service.sendWelcomeEmail('fail@test.com', 'failuser'),
      ).rejects.toBe(originalError);
    });
  });

  describe('message format', () => {
    it('should always use "send_email" as the envelope type', async () => {
      await service.sendWelcomeEmail('a@b.com', 'u');
      await service.sendPasswordChangedEmail('a@b.com', 'u');

      const calls = publisher.publish.mock.calls;
      expect(calls).toHaveLength(2);

      for (const [msg] of calls) {
        expect((msg as any).type).toBe(TASK_TYPE_SEND_EMAIL);
      }
    });

    it('should include email_type and subject in every payload', async () => {
      await service.sendVerificationEmail('a@b.com', 'u', 'tok');

      const payload = (publisher.publish.mock.calls[0][0] as any).payload;
      expect(payload).toHaveProperty('email_type');
      expect(payload).toHaveProperty('subject');
      expect(payload.subject).toBeTruthy();
    });
  });
});
