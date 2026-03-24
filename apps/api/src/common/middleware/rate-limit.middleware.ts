import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RateLimiterService } from '../services/rate-limiter.service';

type RequestWithBody = Request & {
  body?: {
    clientId?: string;
  };
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly rateLimiterService: RateLimiterService) {}

  use(req: RequestWithBody, res: Response, next: NextFunction): void {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
    const maxPerIp = parseInt(process.env.RATE_LIMIT_MAX_PER_IP || '120', 10);
    const maxPerClient = parseInt(
      process.env.RATE_LIMIT_MAX_PER_CLIENT || '300',
      10,
    );

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const clientId =
      req.headers['x-client-id']?.toString() ||
      req.body?.clientId ||
      req.query?.clientId?.toString();

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
