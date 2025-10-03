import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Small helpers to avoid default '[object Object]' stringification
const safeString = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const json = JSON.stringify(v);
    return json === undefined ? Object.prototype.toString.call(v) : json;
  } catch {
    return Object.prototype.toString.call(v);
  }
};

const getErrorMessage = (err: unknown): string => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    const json = JSON.stringify(err);
    return json === undefined ? Object.prototype.toString.call(err) : json;
  } catch {
    return Object.prototype.toString.call(err);
  }
};

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const headers = req.headers as Record<string, unknown> | undefined;

    // Get user agent and other useful info (use safe stringify to avoid [object Object])
    const userAgentRaw =
      headers && headers['user-agent'] ? headers['user-agent'] : undefined;
    const userAgent = userAgentRaw ? safeString(userAgentRaw) : 'Unknown';
    // Removed unused contentLengthHeader

    // Get user ID if authenticated (from JWT payload)
    const userId = this.extractUserIdFromRequest(req);

    // Log request start
    this.logger.log(
      `➤ ${method} ${originalUrl} - IP: ${ip} - User: ${userId || 'Anonymous'} - UA: ${userAgent.substring(0, 50)}...`,
    );

    // Override end method to log response
    const originalSend = res.send.bind(res);
    const logger = this.logger;

    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const contentLength =
        res.get('content-length') || Buffer.byteLength(data || '', 'utf8');

      // Determine log level based on status code
      const logLevel =
        statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'log';

      // Create log message
      const logMessage = `\u27a4 ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${contentLength} bytes - User: ${userId || 'Anonymous'}`;

      // Log errors with more detail
      if (statusCode >= 400) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          const errMsg =
            parsed && typeof parsed === 'object' && 'message' in parsed
              ? safeString(parsed.message)
              : undefined;
          logger[logLevel](
            `${logMessage} - Error: ${errMsg ?? 'Unknown error'}`,
          );
        } catch {
          logger[logLevel](logMessage);
        }
      } else {
        logger[logLevel](logMessage);
      }

      return originalSend(data);
    };

    // Handle response errors
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      this.logger.error(
        `➤ ${method} ${originalUrl} - ERROR - ${duration}ms - User: ${userId || 'Anonymous'} - ${getErrorMessage(error)}`,
      );
    });

    next();
  }

  private extractUserIdFromRequest(req: Request): string | null {
    try {
      // Check if user is attached by JWT guard
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        return (req.user as any).id;
      }

      // Try to extract from Authorization header (if needed)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Could decode JWT here if needed, but usually req.user is set by guards
        return null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

// Additional middleware for sensitive operations logging
@Injectable()
export class SecurityLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SECURITY');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent =
      headers && headers['user-agent']
        ? safeString(headers['user-agent'])
        : 'Unknown';

    // Log security-sensitive operations
    if (this.isSensitiveOperation(originalUrl, method)) {
      const userId = this.extractUserIdFromRequest(req);

      this.logger.warn(
        `🔒 SENSITIVE OPERATION: ${method} ${originalUrl} - IP: ${ip} - User: ${userId || 'Anonymous'} - UA: ${userAgent}`,
      );

      // Log request body for sensitive operations (excluding passwords)
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = this.sanitizeRequestBody(req.body);
        this.logger.warn(`🔒 Request Body: ${JSON.stringify(sanitizedBody)}`);
      }
    }

    next();
  }

  private isSensitiveOperation(url: string, method: string): boolean {
    const sensitivePatterns = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/users/.*/password',
      '/admin/',
      '/auth/logout',
    ];

    return sensitivePatterns.some(
      (pattern) =>
        url.includes(pattern) ||
        (method === 'DELETE' && url.includes('/users/')) ||
        (method === 'PATCH' && url.includes('/users/')),
    );
  }

  private sanitizeRequestBody(body: any): any {
    const sensitiveFields = [
      'password',
      'confirmPassword',
      'oldPassword',
      'newPassword',
      'token',
    ];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private extractUserIdFromRequest(req: Request): string | null {
    try {
      if (req.user && typeof req.user === 'object' && 'id' in req.user) {
        return (req.user as any).id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
