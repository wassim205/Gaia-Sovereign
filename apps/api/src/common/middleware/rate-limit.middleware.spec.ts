import { HttpException } from '@nestjs/common';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RateLimiterService } from '../services/rate-limiter.service';
import { Request, Response, NextFunction } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let rateLimiterService: RateLimiterService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    rateLimiterService = {
      isAllowed: jest.fn(() => true),
      getResetTime: jest.fn(() => 1000),
    } as unknown as RateLimiterService;

    middleware = new RateLimitMiddleware(rateLimiterService);

    mockRequest = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
      headers: {},
      body: {},
      query: {},
    };

    mockResponse = {
      setHeader: jest.fn(() => mockResponse as Response),
    };

    mockNext = jest.fn();
  });

  it('should allow request when IP is within rate limit', () => {
    (rateLimiterService.isAllowed as jest.Mock).mockReturnValue(true);

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled?.();
  });

  it('should block request when IP exceeds rate limit', () => {
    (rateLimiterService.isAllowed as jest.Mock).mockReturnValue(false);
    (rateLimiterService.getResetTime as jest.Mock).mockReturnValue(30000);

    expect(() => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
    }).toThrow(HttpException);
  });

  it('should set Retry-After header when rate limited', () => {
    (rateLimiterService.isAllowed as jest.Mock).mockReturnValue(false);
    (rateLimiterService.getResetTime as jest.Mock).mockReturnValue(30000);

    try {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
    } catch {
      // ignore
    }

    const getHeader = mockResponse.setHeader as jest.Mock;
    expect(getHeader).toHaveBeenCalledWith('Retry-After', '30');
  });

  it('should extract and check client ID', () => {
    mockRequest.headers = { 'x-client-id': 'client-123' };

    (rateLimiterService.isAllowed as jest.Mock).mockReturnValue(true);

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const isAllowed = rateLimiterService.isAllowed as jest.Mock;
    expect(isAllowed).toHaveBeenCalledWith(
      'ip:127.0.0.1',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('should enforce client rate limit when provided', () => {
    mockRequest.headers = { 'x-client-id': 'client-123' };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const mock = rateLimiterService.isAllowed as jest.Mock;
    mock.mockReturnValueOnce(true); // IP allowed
    mock.mockReturnValueOnce(false); // Client blocked

    expect(() => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
    }).toThrow('Too many requests from this client');
  });
});
