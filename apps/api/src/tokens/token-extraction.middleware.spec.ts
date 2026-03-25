import { UnauthorizedException } from '@nestjs/common';
import { TokenExtractionMiddleware } from './token-extraction.middleware';
import type { Response, NextFunction } from 'express';
import type { TokenRequest } from './token-extraction.middleware';

describe('TokenExtractionMiddleware', () => {
  let middleware: TokenExtractionMiddleware;
  let mockRequest: Partial<TokenRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new TokenExtractionMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('valid tokens', () => {
    it('should extract token from valid Bearer header', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token_123',
      };

      middleware.use(
        mockRequest as TokenRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.accessToken).toBe('valid_token_123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle long tokens', () => {
      const longToken = 'a'.repeat(500);
      mockRequest.headers = {
        authorization: `Bearer ${longToken}`,
      };

      middleware.use(
        mockRequest as TokenRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.accessToken).toBe(longToken);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle tokens with special characters', () => {
      const token = 'token_with-special.chars+123/abc=';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      middleware.use(
        mockRequest as TokenRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.accessToken).toBe(token);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('missing authorization', () => {
    it('should allow requests without authorization header', () => {
      mockRequest.headers = {};

      middleware.use(
        mockRequest as TokenRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.accessToken).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not throw when authorization is undefined', () => {
      mockRequest.headers = {
        authorization: undefined,
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('malformed headers', () => {
    it('should reject header without Bearer prefix', () => {
      mockRequest.headers = {
        authorization: 'token_without_bearer',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow('Invalid Authorization header format');
    });

    it('should reject header with wrong scheme', () => {
      mockRequest.headers = {
        authorization: 'Basic token123',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should reject header with only Bearer', () => {
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should reject header with empty token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow('Authorization token is empty');
    });

    it('should reject header with whitespace-only token', () => {
      mockRequest.headers = {
        authorization: 'Bearer    ',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should reject header with multiple spaces', () => {
      mockRequest.headers = {
        authorization: 'Bearer  token  extra',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should reject header with extra parts', () => {
      mockRequest.headers = {
        authorization: 'Bearer token extra_part',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('case sensitivity', () => {
    it('should reject lowercase bearer', () => {
      mockRequest.headers = {
        authorization: 'bearer token123',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should reject mixed case Bearer', () => {
      mockRequest.headers = {
        authorization: 'BEARER token123',
      };

      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('edge cases', () => {
    it('should handle authorization header as array', () => {
      mockRequest.headers = {
        authorization: ['Bearer token1', 'Bearer token2'] as any,
      };

      // Express typically takes the first value
      expect(() =>
        middleware.use(
          mockRequest as TokenRequest,
          mockResponse as Response,
          mockNext,
        ),
      ).toThrow();
    });

    it('should not modify request if no auth header', () => {
      const originalRequest = { ...mockRequest };
      mockRequest.headers = {};

      middleware.use(
        mockRequest as TokenRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.accessToken).toBeUndefined();
    });
  });
});
