import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RateLimiterService } from 'src/common/services/rate-limiter.service';

/**
 * Rate limiter guard for vault scoped API endpoints
 * Limits requests per user to prevent abuse
 * Default: 60 requests per minute per user
 */
@Injectable()
export class VaultRateLimitGuard implements CanActivate {
  // Conservative limits for scoped vault access
  // These involve decryption which is CPU-intensive
  private readonly maxRequests = 60; // per minute
  private readonly windowMs = 60 * 1000; // 1 minute

  constructor(private rateLimiter: RateLimiterService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.headers['x-user-id'];

    if (!userId) {
      // If no identifier, allow request but log warning
      console.warn('VaultRateLimitGuard: No user identifier found');
      return true;
    }

    const identifier = `vault-scoped-${userId}`;
    const isAllowed = this.rateLimiter.isAllowed(
      identifier,
      this.windowMs,
      this.maxRequests,
    );

    if (!isAllowed) {
      const resetTime = this.rateLimiter.getResetTime(identifier);

      throw new HttpException(
        {
          message: `Rate limit exceeded. Max ${this.maxRequests} requests per minute.`,
          retryAfter: Math.ceil(resetTime / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
