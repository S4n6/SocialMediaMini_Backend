import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ReactionNotFoundException,
  InvalidReactionTargetException,
  InvalidReactionTypeException,
  UnauthorizedReactionException,
  PostNotFoundException,
  CommentNotFoundException,
} from '../../domain/exceptions/reaction.exceptions';

export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    path: string;
    method: string;
    requestId?: string;
  };
  data: null;
}

@Catch()
export class ReactionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ReactionExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log error details
    this.logError(exception, request, errorResponse);

    response
      .status(
        errorResponse.error.code === 'INTERNAL_SERVER_ERROR'
          ? 500
          : this.getHttpStatus(exception),
      )
      .json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date();
    const path = request.url;
    const method = request.method;
    const requestId = request.headers['x-request-id'] as string;

    // Handle specific reaction exceptions (these extend NestJS HttpException)
    if (this.isReactionException(exception)) {
      const httpException = exception as HttpException;
      return {
        success: false,
        error: {
          code: this.getDomainErrorCode(exception),
          message: httpException.message,
          details: undefined,
          timestamp,
          path,
          method,
          requestId,
        },
        data: null,
      };
    }

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return {
        success: false,
        error: {
          code: this.getHttpErrorCode(status),
          message:
            typeof response === 'string'
              ? response
              : (response as any).message || exception.message,
          details: typeof response === 'object' ? response : undefined,
          timestamp,
          path,
          method,
          requestId,
        },
        data: null,
      };
    }

    // Handle unexpected errors
    const error = exception as Error;
    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                originalMessage: error.message,
                stack: error.stack,
              }
            : undefined,
        timestamp,
        path,
        method,
        requestId,
      },
      data: null,
    };
  }

  private isReactionException(exception: unknown): boolean {
    return (
      exception instanceof ReactionNotFoundException ||
      exception instanceof InvalidReactionTargetException ||
      exception instanceof InvalidReactionTypeException ||
      exception instanceof UnauthorizedReactionException ||
      exception instanceof PostNotFoundException ||
      exception instanceof CommentNotFoundException
    );
  }

  private getDomainErrorCode(exception: unknown): string {
    if (exception instanceof ReactionNotFoundException) {
      return 'REACTION_NOT_FOUND';
    }
    if (exception instanceof InvalidReactionTypeException) {
      return 'INVALID_REACTION_TYPE';
    }
    if (exception instanceof InvalidReactionTargetException) {
      return 'INVALID_REACTION_TARGET';
    }
    if (exception instanceof UnauthorizedReactionException) {
      return 'UNAUTHORIZED_REACTION';
    }
    if (exception instanceof PostNotFoundException) {
      return 'POST_NOT_FOUND';
    }
    if (exception instanceof CommentNotFoundException) {
      return 'COMMENT_NOT_FOUND';
    }
    return 'DOMAIN_ERROR';
  }

  private getHttpErrorCode(status: number): string {
    const statusMap: Record<number, string> = {
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
      504: 'GATEWAY_TIMEOUT',
    };

    return statusMap[status] || `HTTP_${status}`;
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof ReactionNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof InvalidReactionTypeException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof InvalidReactionTargetException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof UnauthorizedReactionException) {
      return HttpStatus.FORBIDDEN;
    }
    if (exception instanceof PostNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof CommentNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const { error } = errorResponse;
    const logContext = {
      path: error.path,
      method: error.method,
      requestId: error.requestId,
      userId: (request as any).user?.id,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (this.isReactionException(exception)) {
      this.logger.warn(`Reaction domain exception: ${error.code}`, {
        message: error.message,
        details: error.details,
        ...logContext,
      });
    } else if (exception instanceof HttpException) {
      const status = (exception as HttpException).getStatus();
      if (status >= 500) {
        this.logger.error(`HTTP exception: ${error.code}`, {
          message: error.message,
          stack: (exception as Error).stack,
          ...logContext,
        });
      } else {
        this.logger.warn(`HTTP exception: ${error.code}`, {
          message: error.message,
          ...logContext,
        });
      }
    } else {
      this.logger.error(`Unexpected exception: ${error.code}`, {
        message: error.message,
        stack: (exception as Error).stack,
        ...logContext,
      });
    }
  }
}

// Custom decorator for applying the exception filter
export const UseReactionExceptionFilter = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(
        '__exceptionFilters__',
        [ReactionExceptionFilter],
        descriptor.value,
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(
        '__exceptionFilters__',
        [ReactionExceptionFilter],
        target,
      );
    }
  };
};
