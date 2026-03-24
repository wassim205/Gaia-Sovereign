import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

describe('TokenController', () => {
  let controller: TokenController;
  let tokenService: TokenService;

  const mockUser: CurrentUserData = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'testuser',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
      providers: [
        {
          provide: TokenService,
          useValue: {
            revokeAccessTokenById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TokenController>(TokenController);
    tokenService = module.get<TokenService>(TokenService);
  });

  describe('revokeToken', () => {
    it('should revoke token by ID and return success response', async () => {
      const tokenId = 'token-1';
      const revokedToken = {
        id: tokenId,
        appId: 'app-1',
        userId: mockUser.id,
        revokedAt: new Date(),
      };

      (tokenService.revokeAccessTokenById as jest.Mock).mockResolvedValueOnce(
        revokedToken,
      );

      const result = await controller.revokeToken(mockUser, { tokenId });

      expect(result.message).toBe('Token revoked successfully');
      expect(result.data.id).toBe(tokenId);
      expect(result.data.appId).toBe('app-1');
      expect(result.data.revokedAt).toBeInstanceOf(Date);
    });

    it('should throw when token not found', async () => {
      (tokenService.revokeAccessTokenById as jest.Mock).mockRejectedValueOnce(
        new Error('Token not found'),
      );

      await expect(
        controller.revokeToken(mockUser, { tokenId: 'invalid' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw when user does not own token', async () => {
      (tokenService.revokeAccessTokenById as jest.Mock).mockRejectedValueOnce(
        new Error('Unauthorized: Cannot revoke other users tokens'),
      );

      await expect(
        controller.revokeToken(mockUser, { tokenId: 'token-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should pass through service errors', async () => {
      (tokenService.revokeAccessTokenById as jest.Mock).mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(
        controller.revokeToken(mockUser, { tokenId: 'token-1' }),
      ).rejects.toThrow();
    });

    it('should verify token ownership during revocation', async () => {
      const tokenId = 'token-1';

      (tokenService.revokeAccessTokenById as jest.Mock).mockResolvedValueOnce({
        id: tokenId,
        appId: 'app-1',
        userId: mockUser.id,
        revokedAt: new Date(),
      });

      await controller.revokeToken(mockUser, { tokenId });

      expect(tokenService.revokeAccessTokenById).toHaveBeenCalledWith(
        tokenId,
        mockUser.id,
      );
    });

    it('should include revoked token details in response', async () => {
      const tokenId = 'token-1';
      const appId = 'app-1';
      const revokedAt = new Date();

      (tokenService.revokeAccessTokenById as jest.Mock).mockResolvedValueOnce({
        id: tokenId,
        appId,
        userId: mockUser.id,
        revokedAt,
      });

      const result = await controller.revokeToken(mockUser, { tokenId });

      expect(result.data.id).toBe(tokenId);
      expect(result.data.appId).toBe(appId);
      expect(result.data.revokedAt).toEqual(revokedAt);
    });
  });
});
