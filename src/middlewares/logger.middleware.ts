import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    // Get user agent and other useful info
    const userAgent = headers['user-agent'] || 'Unknown';
    const contentLength = headers['content-length'] || '0';

    // Get user ID if authenticated (from JWT payload)
    const userId = this.extractUserIdFromRequest(req);

    // Log request start
    this.logger.log(
      `➤ ${method} ${originalUrl} - IP: ${ip} - User: ${userId || 'Anonymous'} - UA: ${userAgent.substring(0, 50)}...`,
    );

    // Override end method to log response
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const contentLength =
        res.get('content-length') || Buffer.byteLength(data || '', 'utf8');

      // Determine log level based on status code
      const logLevel =
        statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'log';

      // Create log message
      const logMessage = `➤ ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${contentLength} bytes - User: ${userId || 'Anonymous'}`;

      // Log errors with more detail
      if (statusCode >= 400) {
        try {
          const errorData = JSON.parse(data);
          this.logger[logLevel](
            `${logMessage} - Error: ${errorData.message || 'Unknown error'}`,
          );
        } catch {
          this.logger[logLevel](logMessage);
        }
      } else {
        this.logger[logLevel](logMessage);
      }

      return originalSend.call(this, data);
    }.bind(res);

    // Handle response errors
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      this.logger.error(
        `➤ ${method} ${originalUrl} - ERROR - ${duration}ms - User: ${userId || 'Anonymous'} - ${error.message}`,
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
    const userAgent = headers['user-agent'] || 'Unknown';

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
