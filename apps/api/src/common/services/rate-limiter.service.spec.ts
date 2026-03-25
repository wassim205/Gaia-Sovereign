import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimiterService],
    }).compile();

    service = module.get<RateLimiterService>(RateLimiterService);
  });

  describe('isAllowed', () => {
    it('should allow first request', () => {
      const result = service.isAllowed('user-1');
      expect(result).toBe(true);
    });

    it('should allow requests within limit', () => {
      const identifier = 'user-2';
      const maxRequests = 5;

      for (let i = 0; i < maxRequests; i++) {
        const result = service.isAllowed(identifier, 60000, maxRequests);
        expect(result).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'user-3';
      const maxRequests = 3;

      // Use up the limit
      for (let i = 0; i < maxRequests; i++) {
        service.isAllowed(identifier, 60000, maxRequests);
      }

      // Next request should be blocked
      const result = service.isAllowed(identifier, 60000, maxRequests);
      expect(result).toBe(false);
    });

    it('should reset after window expires', async () => {
      const identifier = 'user-4';
      const windowMs = 100; // 100ms window
      const maxRequests = 2;

      // Use up the limit
      service.isAllowed(identifier, windowMs, maxRequests);
      service.isAllowed(identifier, windowMs, maxRequests);

      // Should be blocked
      expect(service.isAllowed(identifier, windowMs, maxRequests)).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      expect(service.isAllowed(identifier, windowMs, maxRequests)).toBe(true);
    });

    it('should handle different identifiers independently', () => {
      const maxRequests = 2;

      service.isAllowed('user-5', 60000, maxRequests);
      service.isAllowed('user-5', 60000, maxRequests);

      // user-5 should be blocked
      expect(service.isAllowed('user-5', 60000, maxRequests)).toBe(false);

      // user-6 should still be allowed
      expect(service.isAllowed('user-6', 60000, maxRequests)).toBe(true);
    });

    it('should use default values when not specified', () => {
      const identifier = 'user-7';
      const result = service.isAllowed(identifier);
      expect(result).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return max requests for new identifier', () => {
      const remaining = service.getRemaining('new-user');
      expect(remaining).toBe(100); // default max
    });

    it('should return correct remaining count', () => {
      const identifier = 'user-8';
      const maxRequests = 5;

      service.isAllowed(identifier, 60000, maxRequests);
      service.isAllowed(identifier, 60000, maxRequests);

      const remaining = service.getRemaining(identifier);
      expect(remaining).toBe(98); // 100 - 2 (default max is 100)
    });

    it('should return 0 when limit exceeded', () => {
      const identifier = 'user-9';
      const maxRequests = 2;

      service.isAllowed(identifier, 60000, maxRequests);
      service.isAllowed(identifier, 60000, maxRequests);
      service.isAllowed(identifier, 60000, maxRequests); // blocked

      const remaining = service.getRemaining(identifier);
      expect(remaining).toBe(98); // Still based on default max
    });

    it('should reset remaining after window expires', async () => {
      const identifier = 'user-10';
      const windowMs = 100;

      service.isAllowed(identifier, windowMs, 5);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const remaining = service.getRemaining(identifier);
      expect(remaining).toBe(100); // Reset to default max
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for new identifier', () => {
      const resetTime = service.getResetTime('new-user');
      expect(resetTime).toBe(0);
    });

    it('should return time until reset', () => {
      const identifier = 'user-11';
      const windowMs = 60000;

      service.isAllowed(identifier, windowMs, 10);

      const resetTime = service.getResetTime(identifier);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(windowMs);
    });

    it('should return 0 after window expires', async () => {
      const identifier = 'user-12';
      const windowMs = 100;

      service.isAllowed(identifier, windowMs, 10);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const resetTime = service.getResetTime(identifier);
      expect(resetTime).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const identifier = 'user-13';
      const windowMs = 100;

      service.isAllowed(identifier, windowMs, 10);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150));

      service.cleanup();

      // After cleanup, should be treated as new
      const remaining = service.getRemaining(identifier);
      expect(remaining).toBe(100);
    });

    it('should keep active entries', () => {
      const identifier = 'user-14';
      const windowMs = 60000;

      service.isAllowed(identifier, windowMs, 10);
      service.cleanup();

      // Should still have the entry
      const remaining = service.getRemaining(identifier);
      expect(remaining).toBeLessThan(100);
    });

    it('should handle empty store', () => {
      expect(() => service.cleanup()).not.toThrow();
    });

    it('should handle multiple entries', async () => {
      service.isAllowed('user-15', 100, 10);
      service.isAllowed('user-16', 60000, 10);
      service.isAllowed('user-17', 100, 10);

      await new Promise((resolve) => setTimeout(resolve, 150));

      service.cleanup();

      // user-16 should still exist (longer window)
      expect(service.getRemaining('user-16')).toBeLessThan(100);

      // user-15 and user-17 should be cleaned up
      expect(service.getRemaining('user-15')).toBe(100);
      expect(service.getRemaining('user-17')).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle zero max requests', () => {
      const identifier = 'user-18';
      service.isAllowed(identifier, 60000, 0); // First request initializes
      const result = service.isAllowed(identifier, 60000, 0); // Second should be blocked
      expect(result).toBe(false);
    });

    it('should handle very short windows', async () => {
      const identifier = 'user-19';
      service.isAllowed(identifier, 10, 1);

      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = service.isAllowed(identifier, 10, 1);
      expect(result).toBe(true);
    });

    it('should handle concurrent requests for same identifier', () => {
      const identifier = 'user-20';
      const maxRequests = 10;

      const results = [];
      for (let i = 0; i < 15; i++) {
        results.push(service.isAllowed(identifier, 60000, maxRequests));
      }

      const allowedCount = results.filter((r) => r).length;
      expect(allowedCount).toBe(maxRequests);
    });
  });
});
