import { LoggerMiddleware } from './logger.middleware';
import { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      get: jest.fn(() => 'Mozilla/5.0' as any),
    };

    const handlers: Record<string, (() => void)[]> = {};
    mockResponse = {
      statusCode: 200,

      on: jest.fn((event: string, handler: () => void) => {
        if (!handlers[event]) handlers[event] = [];
        handlers[event].push(handler);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return mockResponse;
      }),
    };

    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next()', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled?.();
  });

  it('should register finish event handler', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockResponse.on).toHaveBeenCalledWith(
      'finish',
      expect.any(Function),
    );
  });

  it('should extract request info', () => {
    const getSpyOn = jest.spyOn(mockRequest as any, 'get');

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(getSpyOn).toHaveBeenCalled?.();
  });
});
