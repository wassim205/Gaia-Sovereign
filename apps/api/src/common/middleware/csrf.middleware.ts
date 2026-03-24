import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const enableCsrf = process.env.ENABLE_CSRF_PROTECTION === 'true';
    if (!enableCsrf) {
      return next();
    }

    const method = req.method.toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isStateChanging) {
      return next();
    }

    const authCookieName = process.env.AUTH_COOKIE_NAME || 'auth_token';
    const cookieHeader = req.headers.cookie || '';
    const hasAuthCookie = cookieHeader.includes(`${authCookieName}=`);
    if (!hasAuthCookie) {
      return next();
    }

    const csrfCookieName = process.env.CSRF_COOKIE_NAME || 'csrf_token';
    const csrfCookie = this.readCookie(cookieHeader, csrfCookieName);
    const csrfHeader = req.headers['x-csrf-token']?.toString();

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF token is missing or invalid');
    }

    next();
  }

  private readCookie(cookieHeader: string, name: string): string | undefined {
    const pairs = cookieHeader.split(';').map((chunk) => chunk.trim());
    const key = `${name}=`;
    const target = pairs.find((pair) => pair.startsWith(key));
    return target ? decodeURIComponent(target.slice(key.length)) : undefined;
  }
}
