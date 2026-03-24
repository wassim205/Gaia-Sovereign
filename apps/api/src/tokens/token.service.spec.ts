import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            accessToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('generateAccessToken', () => {
    it('should create and store token', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);
      (prisma.accessToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash123',
        expiresAt,
      });

      const result = await service.generateAccessToken({
        userId: 'user-1',
        appId: 'app-1',
        approvedFields: ['email'],
        ttlMinutes: 60,
      });

      expect(result.token).toBe(mockToken);
      expect(result.expiresAt).toEqual(expiresAt);
      expect(jwtService.sign).toHaveBeenCalled?.();
      expect(prisma.accessToken.create).toHaveBeenCalled?.();
    });

    it('should use default TTL if not provided', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);
      (prisma.accessToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash123',
        expiresAt: new Date(),
      });

      await service.generateAccessToken({
        userId: 'user-1',
        appId: 'app-1',
        approvedFields: ['email'],
      });

      expect(prisma.accessToken.create).toHaveBeenCalled?.();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', async () => {
      const payload = {
        sub: 'user-1',
        app_id: 'app-1',
        approved_fields: ['email'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 3600000) / 1000),
      };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValue({
        revokedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await service.verifyAccessToken(mockToken);

      expect(result).toEqual(payload);
    });

    it('should reject expired token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyAccessToken(mockToken)).rejects.toThrow(
        'expired',
      );
    });

    it('should reject revoked token', async () => {
      const payload = {
        sub: 'user-1',
        app_id: 'app-1',
        approved_fields: ['email'],
        iat: 0,
        exp: Math.floor((Date.now() + 3600000) / 1000),
      };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValue({
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      await expect(service.verifyAccessToken(mockToken)).rejects.toThrow(
        'revoked',
      );
    });

    it('should reject malformed token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.verifyAccessToken('bad-token')).rejects.toThrow();
    });
  });

  describe('validateVaultToken', () => {
    it('should return approved fields for valid token', async () => {
      const payload = {
        sub: 'user-1',
        app_id: 'app-1',
        approved_fields: ['email', 'name'],
        iat: 0,
        exp: Math.floor((Date.now() + 3600000) / 1000),
      };

      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (prisma.accessToken.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          revokedAt: null,
          expiresAt: new Date(Date.now() + 3600000),
        })
        .mockResolvedValueOnce({
          userId: 'user-1',
          appId: 'app-1',
          approvedFields: ['email', 'name'],
        });

      const result = await service.validateVaultToken(mockToken);

      expect(result.userId).toBe('user-1');
      expect(result.approvedFields).toEqual(['email', 'name']);
    });
  });

  describe('revokeAccessToken', () => {
    it('should mark token as revoked', async () => {
      (prisma.accessToken.update as jest.Mock).mockResolvedValue({
        tokenHash: 'hash123',
        revokedAt: new Date(),
      });

      await service.revokeAccessToken(mockToken);

      expect(prisma.accessToken.update).toHaveBeenCalledWith?.(
        expect.anything() as never,
      );
    });
  });

  describe('revokeAccessTokenById', () => {
    it('should revoke token by ID if user owns it', async () => {
      const tokenId = 'token-1';
      const userId = 'user-1';

      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValueOnce({
        id: tokenId,
        userId,
        appId: 'app-1',
        approvedFields: ['email'],
      });

      (prisma.accessToken.update as jest.Mock).mockResolvedValue({
        id: tokenId,
        userId,
        appId: 'app-1',
        approvedFields: ['email'],
        revokedAt: new Date(),
      });

      const result = await service.revokeAccessTokenById(tokenId, userId);

      expect(result.revokedAt).toBeInstanceOf(Date);
    });

    it('should throw if user does not own token', async () => {
      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'token-1',
        userId: 'other-user',
        appId: 'app-1',
      });

      await expect(
        service.revokeAccessTokenById('token-1', 'user-1'),
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw if token does not exist', async () => {
      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.revokeAccessTokenById('token-1', 'user-1'),
      ).rejects.toThrow('Token not found');
    });
  });

  describe('getTokenInfo', () => {
    it('should return token metadata', async () => {
      const tokenInfo = {
        id: 'token-1',
        appId: 'app-1',
        userId: 'user-1',
        approvedFields: ['email', 'name'],
        expiresAt: new Date(Date.now() + 3600000),
        revokedAt: null,
        createdAt: new Date(),
      };

      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValue(tokenInfo);

      const result = await service.getTokenInfo(mockToken);

      expect(result?.appId).toBe('app-1');
      expect(result?.approvedFields).toEqual(['email', 'name']);
    });
  });

  describe('token integration flow', () => {
    it('should complete generate->verify->use->revoke cycle', async () => {
      const userId = 'user-123';
      const appId = 'app-456';
      const approvedFields = ['email', 'name'];
      const payload = {
        sub: userId,
        app_id: appId,
        approved_fields: approvedFields,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 3600000) / 1000),
      };

      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);
      (prisma.accessToken.create as jest.Mock).mockResolvedValue({
        tokenHash: 'hash123',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const generated = await service.generateAccessToken({
        userId,
        appId,
        approvedFields,
      });

      expect(generated.token).toBe(mockToken);

      (jwtService.verify as jest.Mock).mockReturnValue(payload);
      (prisma.accessToken.findUnique as jest.Mock).mockResolvedValue({
        revokedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const verified = await service.verifyAccessToken(generated.token);

      expect(verified.sub).toBe(userId);

      (prisma.accessToken.update as jest.Mock).mockResolvedValue({
        revokedAt: new Date(),
      });

      await service.revokeAccessToken(generated.token);

      (prisma.accessToken.update as jest.Mock).mockClear();
    });
  });
});
