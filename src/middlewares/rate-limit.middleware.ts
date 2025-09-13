import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = this.getClientIp(req);
    const route = req.route?.path || req.path;
    const method = req.method;

    // Define rate limits for different endpoints
    const rateLimits = this.getRateLimits(route, method);

    if (!rateLimits) {
      return next();
    }

    const key = `${clientIp}:${route}:${method}`;
    const now = Date.now();
    const windowMs = rateLimits.windowMs;
    const maxRequests = rateLimits.max;

    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    // Get or create rate limit entry
    if (!this.store[key]) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      // Reset if window has expired
      if (now > this.store[key].resetTime) {
        this.store[key] = {
          count: 1,
          resetTime: now + windowMs,
        };
      } else {
        this.store[key].count++;
      }
    }

    const current = this.store[key];
    const remaining = Math.max(0, maxRequests - current.count);
    const resetTimeSeconds = Math.ceil((current.resetTime - now) / 1000);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds);

    // Check if rate limit exceeded
    if (current.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`,
        retryAfter: resetTimeSeconds,
      });
      return;
    }

    next();
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    )
      .split(',')[0]
      .trim();
  }

  private getRateLimits(
    route: string,
    method: string,
  ): { windowMs: number; max: number } | null {
    // Authentication endpoints - stricter limits
    if (route.includes('/auth/login')) {
      return { windowMs: 15 * 60 * 1000, max: 5 }; // 5 attempts per 15 minutes
    }

    if (route.includes('/auth/register')) {
      return { windowMs: 60 * 60 * 1000, max: 3 }; // 3 registrations per hour
    }

    if (route.includes('/auth/refresh')) {
      return { windowMs: 60 * 1000, max: 10 }; // 10 refresh per minute
    }

    // Content creation - moderate limits
    if (method === 'POST' && route.includes('/posts')) {
      return { windowMs: 60 * 1000, max: 5 }; // 5 posts per minute
    }

    if (method === 'POST' && route.includes('/comments')) {
      return { windowMs: 60 * 1000, max: 10 }; // 10 comments per minute
    }

    if (method === 'POST' && route.includes('/reactions')) {
      return { windowMs: 60 * 1000, max: 30 }; // 30 reactions per minute
    }

    // Follow/Unfollow actions
    if (route.includes('/follow')) {
      return { windowMs: 60 * 1000, max: 20 }; // 20 follow actions per minute
    }

    // File uploads
    if (route.includes('/cloudinary') || route.includes('/upload')) {
      return { windowMs: 60 * 1000, max: 10 }; // 10 uploads per minute
    }

    // General API - lenient limits
    if (method === 'GET') {
      return { windowMs: 60 * 1000, max: 100 }; // 100 GET requests per minute
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return { windowMs: 60 * 1000, max: 30 }; // 30 write operations per minute
    }

    if (method === 'DELETE') {
      return { windowMs: 60 * 1000, max: 10 }; // 10 delete operations per minute
    }

    return null; // No rate limiting
  }

  private cleanupExpiredEntries(now: number) {
    // Clean up expired entries every 5 minutes
    if (!this.lastCleanup || now - this.lastCleanup > 5 * 60 * 1000) {
      Object.keys(this.store).forEach((key) => {
        if (now > this.store[key].resetTime) {
          delete this.store[key];
        }
      });
      this.lastCleanup = now;
    }
  }

  private lastCleanup = 0;
}
