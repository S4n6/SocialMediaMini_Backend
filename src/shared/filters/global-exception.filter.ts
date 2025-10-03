import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { ErrorMonitoringService } from '../services/error-monitoring.service';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import {
  DomainException,
  ValidationException,
  EntityNotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BusinessRuleException,
  DatabaseException,
  ExternalServiceException,
  RateLimitException,
  ConfigurationException,
  FileOperationException,
} from '../exceptions/domain.exception';
import {
  IErrorResponse,
  IErrorInfo,
  ErrorSeverity,
  ErrorCategory,
  IErrorContext,
} from '../exceptions/error-response.interface';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly errorMonitoringService: ErrorMonitoringService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorInfo = this.buildErrorInfo(exception, request);

    // Log error based on severity
    this.logError(errorInfo);

    // Send response
    response.status(errorInfo.response.statusCode).json(errorInfo.response);
  }

  private buildErrorInfo(exception: unknown, request: Request): IErrorInfo {
    const context = this.extractContext(request);
    const requestId = this.generateRequestId();

    let errorResponse: IErrorResponse;
    let severity: ErrorSeverity;
    let category: ErrorCategory;
    let shouldReport = true;

    if (exception instanceof DomainException) {
      ({ errorResponse, severity, category } = this.handleDomainException(
        exception,
        request,
        requestId,
      ));
      shouldReport =
        severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL;
    } else if (exception instanceof HttpException) {
      ({ errorResponse, severity, category } = this.handleHttpException(
        exception,
        request,
        requestId,
      ));
      shouldReport = exception.getStatus() >= 500;
    } else if (exception instanceof MulterError) {
      ({ errorResponse, severity, category } = this.handleMulterError(
        exception,
        request,
        requestId,
      ));
      shouldReport = false;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ errorResponse, severity, category } = this.handlePrismaError(
        exception,
        request,
        requestId,
      ));
      shouldReport = true;
    } else if (
      exception instanceof JsonWebTokenError ||
      exception instanceof TokenExpiredError
    ) {
      ({ errorResponse, severity, category } = this.handleJwtError(
        exception,
        request,
        requestId,
      ));
      shouldReport = false;
    } else {
      ({ errorResponse, severity, category } = this.handleUnknownError(
        exception,
        request,
        requestId,
      ));
      shouldReport = true;
    }

    return {
      response: errorResponse,
      severity,
      category,
      context,
      originalError:
        exception instanceof Error ? exception : new Error(String(exception)),
      shouldReport,
    };
  }

  private handleDomainException(
    exception: DomainException,
    request: Request,
    requestId: string,
  ): {
    errorResponse: IErrorResponse;
    severity: ErrorSeverity;
    category: ErrorCategory;
  } {
    let category: ErrorCategory;
    let severity: ErrorSeverity;

    // Determine category and severity based on exception type
    if (exception instanceof ValidationException) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
    } else if (exception instanceof EntityNotFoundException) {
      category = ErrorCategory.BUSINESS_LOGIC;
      severity = ErrorSeverity.LOW;
    } else if (exception instanceof UnauthorizedException) {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (exception instanceof ForbiddenException) {
      category = ErrorCategory.AUTHORIZATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (exception instanceof BusinessRuleException) {
      category = ErrorCategory.BUSINESS_LOGIC;
      severity = ErrorSeverity.MEDIUM;
    } else if (exception instanceof DatabaseException) {
      category = ErrorCategory.DATABASE;
      severity = ErrorSeverity.HIGH;
    } else if (exception instanceof ExternalServiceException) {
      category = ErrorCategory.EXTERNAL_SERVICE;
      severity = ErrorSeverity.HIGH;
    } else if (exception instanceof RateLimitException) {
      category = ErrorCategory.RATE_LIMIT;
      severity = ErrorSeverity.LOW;
    } else if (exception instanceof ConfigurationException) {
      category = ErrorCategory.CONFIGURATION;
      severity = ErrorSeverity.CRITICAL;
    } else if (exception instanceof FileOperationException) {
      category = ErrorCategory.FILE_OPERATION;
      severity = ErrorSeverity.MEDIUM;
    } else {
      category = ErrorCategory.BUSINESS_LOGIC;
      severity = ErrorSeverity.MEDIUM;
    }

    const errorResponse: IErrorResponse = {
      statusCode: exception.statusCode,
      message: exception.message,
      code: exception.code,
      error: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // Add validation errors if present
    if (
      exception instanceof ValidationException &&
      exception.validationErrors
    ) {
      errorResponse.validationErrors = exception.validationErrors;
    }

    // Add debug info in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = exception.getDetails();
      errorResponse.stack = exception.stack;
    }

    return { errorResponse, severity, category };
  }

  private handleHttpException(
    exception: HttpException,
    request: Request,
    requestId: string,
  ): {
    errorResponse: IErrorResponse;
    severity: ErrorSeverity;
    category: ErrorCategory;
  } {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let category: ErrorCategory;
    let severity: ErrorSeverity;

    if (status >= 500) {
      category = ErrorCategory.SYSTEM;
      severity = ErrorSeverity.HIGH;
    } else if (status === 401) {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (status === 403) {
      category = ErrorCategory.AUTHORIZATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (status === 429) {
      category = ErrorCategory.RATE_LIMIT;
      severity = ErrorSeverity.LOW;
    } else {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
    }

    const errorResponse: IErrorResponse = {
      statusCode: status,
      message:
        typeof response === 'string'
          ? response
          : (response as any)?.message || exception.message,
      code: this.getHttpErrorCode(status),
      error: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = exception.stack;
    }

    return { errorResponse, severity, category };
  }

  private handleMulterError(
    exception: MulterError,
    request: Request,
    requestId: string,
  ): {
    errorResponse: IErrorResponse;
    severity: ErrorSeverity;
    category: ErrorCategory;
  } {
    let message: string;
    let statusCode: number;

    switch (exception.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Max allowed size is 50 MB.';
        statusCode = HttpStatus.PAYLOAD_TOO_LARGE;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      default:
        message = exception.message || 'File upload error';
        statusCode = HttpStatus.BAD_REQUEST;
    }

    const errorResponse: IErrorResponse = {
      statusCode,
      message,
      code: `MULTER_${exception.code}`,
      error: 'MulterError',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    return {
      errorResponse,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.FILE_OPERATION,
    };
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
    requestId: string,
  ): {
    errorResponse: IErrorResponse;
    severity: ErrorSeverity;
    category: ErrorCategory;
  } {
    let message: string;
    let statusCode: number;
    let code: string;

    switch (exception.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        statusCode = HttpStatus.CONFLICT;
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        code = 'RECORD_NOT_FOUND';
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = HttpStatus.BAD_REQUEST;
        code = 'FOREIGN_KEY_CONSTRAINT';
        break;
      case 'P2014':
        message =
          'The change you are trying to make would violate the required relation';
        statusCode = HttpStatus.BAD_REQUEST;
        code = 'REQUIRED_RELATION_VIOLATION';
        break;
      default:
        message = 'Database operation failed';
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        code = 'DATABASE_ERROR';
    }

    const errorResponse: IErrorResponse = {
      statusCode,
      message,
      code,
      error: 'DatabaseError',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        prismaCode: exception.code,
        prismaMessage: exception.message,
      };
    }

    return {
      errorResponse,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.DATABASE,
    };
  }

  private handleJwtError(
    exception: JsonWebTokenError | TokenExpiredError,
    request: Request,
    requestId: string,
  ): {
    errorResponse: IErrorResponse;
    severity: ErrorSeverity;
    category: ErrorCategory;
  } {
    let message: string;
    let code: string;

    if (exception instanceof TokenExpiredError) {
      message = 'Token has expired';
      code = 'TOKEN_EXPIRED';
    } else {
      message = 'Invalid token';
      code = 'INVALID_TOKEN';
    }

    const errorResponse: IErrorResponse = {
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      code,
      error: 'AuthenticationError',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    return {
      errorResponse,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.AUTHENTICATION,
    };
  }

  private handleUnknownError(
    exception: unknown,
    request: Request,
    requestId: string,
  ): {
    errorResponse: IErrorResponse;
    severity: ErrorSeverity;
    category: ErrorCategory;
  } {
    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    const errorResponse: IErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      error: 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.message = error.message;
      errorResponse.stack = error.stack;
    }

    return {
      errorResponse,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.SYSTEM,
    };
  }

  private extractContext(request: Request): IErrorContext {
    // Safely extract user id from request.user if available
    let userId: string | undefined;
    const maybeUser = (request as unknown as { user?: unknown }).user;
    if (maybeUser && typeof maybeUser === 'object') {
      const u = maybeUser as Record<string, unknown>;
      if (typeof u.id === 'string') userId = u.id;
      else if (typeof u.sub === 'string') userId = u.sub;
    }

    const conn = (request as unknown as { connection?: unknown }).connection as
      | { remoteAddress?: string }
      | undefined;

    const userAgent =
      typeof request.get === 'function' ? request.get('user-agent') : undefined;

    return {
      userId,
      ipAddress: request.ip || (conn && conn.remoteAddress),
      userAgent: typeof userAgent === 'string' ? userAgent : undefined,
      method: request.method,
      url: request.url,
      // Don't log sensitive data like passwords
      requestBody: this.sanitizeRequestBody(request.body),
      headers: this.sanitizeHeaders(
        request.headers as Record<string, unknown> | undefined,
      ),
    };
  }

  private sanitizeRequestBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return undefined;

    const sanitized = { ...(body as Record<string, unknown>) } as Record<
      string,
      unknown
    >;
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

    for (const field of sensitiveFields) {
      if (Object.prototype.hasOwnProperty.call(sanitized, field)) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(
    headers?: Record<string, unknown>,
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    if (!headers || typeof headers !== 'object') return sanitized;

    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const [key, value] of Object.entries(headers)) {
      try {
        const v = typeof value === 'string' ? value : JSON.stringify(value);
        sanitized[key] = sensitiveHeaders.includes(key.toLowerCase())
          ? '[REDACTED]'
          : v;
      } catch {
        sanitized[key] = '[UNSERIALIZABLE]';
      }
    }

    return sanitized;
  }

  private getHttpErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return codes[status] || 'UNKNOWN_ERROR';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(errorInfo: IErrorInfo): void {
    const { response, severity, category, context, originalError } = errorInfo;
    const logger = this.logger;

    const safeMessage =
      typeof response.message === 'string'
        ? response.message
        : String(response.message);
    const logMessage = `[${String(category).toUpperCase()}] ${safeMessage}`;
    const logContext = {
      requestId: response.requestId,
      statusCode: response.statusCode,
      code: response.code,
      path: response.path,
      userId: context.userId,
      ip: context.ipAddress,
      userAgent: context.userAgent,
      method: context.method,
    };

    const originalErr =
      originalError instanceof Error ? originalError : undefined;

    switch (severity) {
      case ErrorSeverity.LOW:
        logger.warn(logMessage, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.error(logMessage, logContext);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error(logMessage, {
          ...logContext,
          stack: originalErr?.stack,
          originalError: originalErr?.message,
        });
        break;
    }

    // Send to monitoring service for reportable errors
    if (errorInfo.shouldReport) {
      // Fire and forget - explicitly ignore the returned promise to satisfy linter
      void this.reportToMonitoringService(errorInfo).catch((e) => {
        const monitoringErr = e as unknown as { message?: string };
        logger.error('Failed to report error to monitoring service', {
          requestId: errorInfo.response.requestId,
          monitoringError: monitoringErr?.message ?? String(e),
        });
      });
    }
  }

  private async reportToMonitoringService(
    errorInfo: IErrorInfo,
  ): Promise<void> {
    try {
      await this.errorMonitoringService.reportError(errorInfo);
    } catch (error) {
      // Don't let monitoring errors affect the main response
      this.logger.error('Failed to report error to monitoring service', {
        requestId: errorInfo.response.requestId,
        monitoringError: error.message,
      });
    }
  }
}
