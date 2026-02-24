import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkerSecretGuard } from './worker-secret.guard';

function createMockConfigService(secret?: string): ConfigService {
  return {
    get: jest.fn().mockReturnValue(secret),
  } as any;
}

function createMockExecutionContext(headerValue?: string): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers:
          headerValue !== undefined ? { 'x-worker-secret': headerValue } : {},
        ip: '127.0.0.1',
      }),
    }),
  };
}

describe('WorkerSecretGuard', () => {
  it('should allow request when secret matches', () => {
    const guard = new WorkerSecretGuard(
      createMockConfigService('my-secret-123'),
    );
    const context = createMockExecutionContext('my-secret-123');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject when header is missing', () => {
    const guard = new WorkerSecretGuard(
      createMockConfigService('my-secret-123'),
    );
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject when header has wrong value', () => {
    const guard = new WorkerSecretGuard(
      createMockConfigService('my-secret-123'),
    );
    const context = createMockExecutionContext('wrong-secret');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject when WORKER_CALLBACK_SECRET is not configured', () => {
    const guard = new WorkerSecretGuard(createMockConfigService(undefined));
    const context = createMockExecutionContext('any-value');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'Internal endpoint not configured',
    );
  });

  it('should reject when header is empty string', () => {
    const guard = new WorkerSecretGuard(
      createMockConfigService('my-secret-123'),
    );
    const context = createMockExecutionContext('');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
