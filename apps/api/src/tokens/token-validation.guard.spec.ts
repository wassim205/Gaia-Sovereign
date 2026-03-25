import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenValidationGuard } from './token-validation.guard';
import { TokenService } from './token.service';

describe('TokenValidationGuard', () => {
  let guard: TokenValidationGuard;
  let tokenService: TokenService;

  const mockTokenService = {
    validateVaultToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenValidationGuard,
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    guard = module.get<TokenValidationGuard>(TokenValidationGuard);
    tokenService = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (token?: string): ExecutionContext => {
    const request = {
      accessToken: token,
      tokenContext: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  describe('GS-111: Token Middleware Tests', () => {
    describe('valid tokens', () => {
      it('should allow access with valid token', async () => {
        const mockTokenData = {
          userId: 'user-123',
          appId: 'app-123',
          approvedFields: ['email', 'name'],
        };

        mockTokenService.validateVaultToken.mockResolvedValue(mockTokenData);

        const context = createMockContext('valid_token_123');
        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(tokenService.validateVaultToken).toHaveBeenCalledWith(
          'valid_token_123',
        );

        const request = context.switchToHttp().getRequest();
        expect(request.tokenContext).toEqual(mockTokenData);
      });

      it('should attach token context to request', async () => {
        const mockTokenData = {
          userId: 'user-456',
          appId: 'app-456',
          approvedFields: ['phone'],
        };

        mockTokenService.validateVaultToken.mockResolvedValue(mockTokenData);

        const context = createMockContext('token_xyz');
        await guard.canActivate(context);

        const request = context.switchToHttp().getRequest();
        expect(request.tokenContext?.userId).toBe('user-456');
        expect(request.tokenContext?.appId).toBe('app-456');
        expect(request.tokenContext?.approvedFields).toEqual(['phone']);
      });
    });

    describe('expired tokens', () => {
      it('should reject expired token', async () => {
        mockTokenService.validateVaultToken.mockRejectedValue(
          new Error('Token has expired'),
        );

        const context = createMockContext('expired_token');

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Token validation failed: Token has expired',
        );
      });
    });

    describe('revoked tokens', () => {
      it('should reject revoked token', async () => {
        mockTokenService.validateVaultToken.mockRejectedValue(
          new Error('Token has been revoked'),
        );

        const context = createMockContext('revoked_token');

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Token validation failed: Token has been revoked',
        );
      });
    });

    describe('malformed tokens', () => {
      it('should reject missing token', async () => {
        const context = createMockContext();

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(context)).rejects.toThrow(
          'No access token provided',
        );
      });

      it('should reject invalid token format', async () => {
        mockTokenService.validateVaultToken.mockRejectedValue(
          new Error('Invalid token format'),
        );

        const context = createMockContext('malformed_token');

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Token validation failed: Invalid token format',
        );
      });

      it('should reject token with invalid signature', async () => {
        mockTokenService.validateVaultToken.mockRejectedValue(
          new Error('Invalid token signature'),
        );

        const context = createMockContext('tampered_token');

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Token validation failed: Invalid token signature',
        );
      });

      it('should reject empty string token', async () => {
        const context = createMockContext('');

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('token not found', () => {
      it('should reject non-existent token', async () => {
        mockTokenService.validateVaultToken.mockRejectedValue(
          new Error('Token not found'),
        );

        const context = createMockContext('nonexistent_token');

        await expect(guard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Token validation failed: Token not found',
        );
      });
    });
  });
});
