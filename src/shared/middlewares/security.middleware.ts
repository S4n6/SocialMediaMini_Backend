import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Remove sensitive headers that might reveal server info
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Content Security Policy - strict for social media
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://api.cloudinary.com https://accounts.google.com",
      "frame-src 'self' https://accounts.google.com",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS Protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Referrer Policy - balance privacy and functionality for social media
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (Feature Policy replacement)
    const permissionsPolicy = [
      'geolocation=(self)',
      'microphone=()',
      'camera=(self)', // Allow camera for profile pics/stories
      'fullscreen=(self)',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', ');

    res.setHeader('Permissions-Policy', permissionsPolicy);

    // Cross-Origin policies for social media app
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none'); // Allow embeds for social content
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // Allow Google OAuth popup
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow resource sharing

    // Additional security headers for APIs
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      // Prevent caching of sensitive endpoints
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Custom security header for API versioning
    res.setHeader('X-API-Version', '1.0.0');

    // Rate limit info header (will be set by rate limit middleware)
    if (!res.getHeader('X-RateLimit-Limit')) {
      res.setHeader('X-Rate-Limit-Policy', 'See /api/rate-limits for details');
    }

    next();
  }
}

// Middleware specifically for file upload endpoints
@Injectable()
export class FileUploadSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Additional headers for file upload endpoints
    if (req.path.includes('/upload') || req.path.includes('/cloudinary')) {
      // Prevent file execution
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'attachment');

      // Limit file types via CSP
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; img-src 'self' data:; media-src 'self'",
      );
    }

    next();
  }
}

// Middleware for WebSocket security (if using Socket.IO)
@Injectable()
export class WebSocketSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Additional headers for WebSocket endpoints
    if (
      req.path.includes('/socket.io') ||
      req.headers.upgrade === 'websocket'
    ) {
      // Allow WebSocket upgrade
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    }

    next();
  }
}
