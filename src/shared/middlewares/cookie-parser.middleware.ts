import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CookieParserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Parse cookies from Cookie header
    req.cookies = this.parseCookies(req.headers.cookie);

    // Add helper methods to response for setting secure cookies
    this.addCookieHelpers(res);

    next();
  }

  private parseCookies(cookieHeader?: string): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};

    if (!cookieHeader) {
      return cookies;
    }

    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.split('=');
      const value = rest.join('=');

      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      }
    });

    return cookies;
  }

  private addCookieHelpers(res: Response) {
    // Helper to set secure auth cookies implemented as closures (avoid using `this`)
    const setAuthCookie = (
      name: string,
      value: string,
      options: {
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
        domain?: string;
        path?: string;
      } = {},
    ): Response => {
      const isProd = process.env.NODE_ENV === 'production';

      const defaultOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        path: '/',
        ...options,
      };

      let cookieString = `${name}=${encodeURIComponent(value)}`;

      if (defaultOptions.maxAge) {
        cookieString += `; Max-Age=${Math.floor(defaultOptions.maxAge / 1000)}`;
      }

      if (defaultOptions.domain) {
        cookieString += `; Domain=${defaultOptions.domain}`;
      }

      if (defaultOptions.path) {
        cookieString += `; Path=${defaultOptions.path}`;
      }

      if (defaultOptions.httpOnly) {
        cookieString += '; HttpOnly';
      }

      if (defaultOptions.secure) {
        cookieString += '; Secure';
      }

      if (defaultOptions.sameSite) {
        cookieString += `; SameSite=${defaultOptions.sameSite}`;
      }

      res.setHeader('Set-Cookie', cookieString);
      return res;
    };

    // Helper to clear auth cookies implemented as closures (avoid using `this`)
    const clearAuthCookie = (
      name: string,
      options: {
        domain?: string;
        path?: string;
      } = {},
    ): Response => {
      const isProd = process.env.NODE_ENV === 'production';

      let cookieString = `${name}=; Max-Age=0`;

      if (options.domain) {
        cookieString += `; Domain=${options.domain}`;
      }

      if (options.path) {
        cookieString += `; Path=${options.path}`;
      } else {
        cookieString += '; Path=/';
      }

      cookieString += '; HttpOnly';

      if (isProd) {
        cookieString += '; Secure; SameSite=none';
      } else {
        cookieString += '; SameSite=lax';
      }

      const existingCookies = res.getHeaders()['set-cookie'] || [];
      const cookiesArray = Array.isArray(existingCookies)
        ? existingCookies
        : [existingCookies];
      cookiesArray.push(cookieString);

      res.setHeader('Set-Cookie', cookiesArray);
      return res;
    };

    // Attach helpers to response
    res.setAuthCookie = setAuthCookie;
    res.clearAuthCookie = clearAuthCookie;
  }
}

// Extend Express types to include our custom methods
declare global {
  namespace Express {
    interface Request {
      cookies: { [key: string]: string };
    }

    interface Response {
      setAuthCookie(
        name: string,
        value: string,
        options?: {
          maxAge?: number;
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: 'strict' | 'lax' | 'none';
          domain?: string;
          path?: string;
        },
      ): Response;

      clearAuthCookie(
        name: string,
        options?: {
          domain?: string;
          path?: string;
        },
      ): Response;
    }
  }
}
