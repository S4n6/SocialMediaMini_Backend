import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard for internal endpoints called by the Go worker.
 *
 * Validates the `x-worker-secret` header against the
 * `WORKER_CALLBACK_SECRET` environment variable.
 *
 * Usage:
 *   @UseGuards(WorkerSecretGuard)
 *   @Post('internal/media/callback')
 */
@Injectable()
export class WorkerSecretGuard implements CanActivate {
  private readonly logger = new Logger(WorkerSecretGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-worker-secret'] as string | undefined;
    const expectedSecret = this.configService.get<string>(
      'WORKER_CALLBACK_SECRET',
    );

    if (!expectedSecret) {
      this.logger.error(
        'WORKER_CALLBACK_SECRET is not configured — rejecting all worker callbacks',
      );
      throw new UnauthorizedException('Internal endpoint not configured');
    }

    if (!secret || secret !== expectedSecret) {
      this.logger.warn(
        `Rejected worker callback — invalid or missing x-worker-secret header (IP: ${request.ip})`,
      );
      throw new UnauthorizedException('Invalid worker secret');
    }

    return true;
  }
}
