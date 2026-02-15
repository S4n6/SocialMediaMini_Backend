import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthDomainException } from '../../domain/exceptions/auth.exceptions';

/**
 * Auth Exception Filter
 * Maps domain exceptions to appropriate HTTP status codes
 */
@Catch(AuthDomainException)
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly exceptionMap = new Map<string, HttpStatus>([
    // 400 - Bad Request
    ['INVALID_PASSWORD', HttpStatus.BAD_REQUEST],
    ['PASSWORD_MISMATCH', HttpStatus.BAD_REQUEST],
    ['INVALID_VALIDATION', HttpStatus.BAD_REQUEST],
    ['EMAIL_ALREADY_VERIFIED', HttpStatus.BAD_REQUEST],
    ['RATE_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS],

    // 401 - Unauthorized
    ['INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED],
    ['INVALID_TOKEN', HttpStatus.UNAUTHORIZED],
    ['TOKEN_EXPIRED', HttpStatus.UNAUTHORIZED],
    ['TOKEN_REVOKED', HttpStatus.UNAUTHORIZED],
    ['SESSION_EXPIRED', HttpStatus.UNAUTHORIZED],
    ['SESSION_REVOKED', HttpStatus.UNAUTHORIZED],

    // 403 - Forbidden
    ['USER_NOT_VERIFIED', HttpStatus.FORBIDDEN],
    ['EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN],
    ['MAX_SESSIONS_EXCEEDED', HttpStatus.FORBIDDEN],

    // 404 - Not Found
    ['USER_NOT_FOUND', HttpStatus.NOT_FOUND],
    ['SESSION_NOT_FOUND', HttpStatus.NOT_FOUND],

    // 409 - Conflict
    ['USER_ALREADY_EXISTS', HttpStatus.CONFLICT],
    ['USERNAME_ALREADY_TAKEN', HttpStatus.CONFLICT],
  ]);

  catch(exception: AuthDomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode =
      this.exceptionMap.get(exception.code) || HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(statusCode).json({
      success: false,
      statusCode,
      error: exception.name,
      message: exception.message,
      code: exception.code,
      timestamp: new Date().toISOString(),
      ...(exception.details && { details: exception.details }),
    });
  }
}
