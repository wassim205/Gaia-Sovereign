import { Injectable } from '@nestjs/common';
import { Request } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

@Injectable()
export class RateLimiterService {
  private store: RateLimitStore = {};
  private readonly defaultWindowMs = 60 * 1000; // 1 minute
  private readonly defaultMaxRequests = 100; // 100 requests per window

  /**
   * Check if a request should be rate limited
   * @param identifier Unique identifier (e.g., IP, user ID, etc.)
   * @param windowMs Time window in milliseconds
   * @param maxRequests Maximum requests allowed in the window
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(
    identifier: string,
    windowMs: number = this.defaultWindowMs,
    maxRequests: number = this.defaultMaxRequests,
  ): boolean {
    const now = Date.now();
    const key = identifier;

    // Initialize or reset if window has expired
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return true;
    }

    // Check if limit exceeded
    if (this.store[key].count >= maxRequests) {
      return false;
    }

    // Increment counter
    this.store[key].count++;
    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const key = identifier;

    if (!this.store[key] || this.store[key].resetTime < now) {
      return this.defaultMaxRequests;
    }

    return Math.max(0, this.defaultMaxRequests - this.store[key].count);
  }

  /**
   * Get time until reset in milliseconds
   */
  getResetTime(identifier: string): number {
    const now = Date.now();
    const key = identifier;

    if (!this.store[key]) {
      return 0;
    }

    return Math.max(0, this.store[key].resetTime - now);
  }

  /**
   * Clean up old entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    const keys = Object.keys(this.store);

    for (const key of keys) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }
}
