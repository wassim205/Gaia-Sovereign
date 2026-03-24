import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RateLimiterService } from '../services/rate-limiter.service';

const getClientIdFromQuery = (query: Request['query']): string | undefined => {
  const raw = query.clientId;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') {
    return raw[0];
  }
  return undefined;
};

const getClientIdFromBody = (body: unknown): string | undefined => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  const maybeClientId = (body as { clientId?: unknown }).clientId;
  return typeof maybeClientId === 'string' ? maybeClientId : undefined;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly rateLimiterService: RateLimiterService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
    const maxPerIp = parseInt(process.env.RATE_LIMIT_MAX_PER_IP || '120', 10);
    const maxPerClient = parseInt(
      process.env.RATE_LIMIT_MAX_PER_CLIENT || '300',
      10,
    );

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const clientId =
      req.headers['x-client-id']?.toString() ||
      getClientIdFromBody(req.body) ||
      getClientIdFromQuery(req.query);

    const ipAllowed = this.rateLimiterService.isAllowed(
      `ip:${ip}`,
      windowMs,
      maxPerIp,
    );

    if (!ipAllowed) {
      const retryAfterSeconds = Math.ceil(
        this.rateLimiterService.getResetTime(`ip:${ip}`) / 1000,
      );
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        'Too many requests from this IP, please retry later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (clientId) {
      const clientAllowed = this.rateLimiterService.isAllowed(
        `client:${clientId}`,
        windowMs,
        maxPerClient,
      );
      if (!clientAllowed) {
        const retryAfterSeconds = Math.ceil(
          this.rateLimiterService.getResetTime(`client:${clientId}`) / 1000,
        );
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        throw new HttpException(
          'Too many requests from this client, please retry later',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    next();
  }
}
