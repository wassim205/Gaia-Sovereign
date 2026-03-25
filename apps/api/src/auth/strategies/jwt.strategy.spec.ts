/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from 'src/users/users.service';
import type { JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const mockPayload: JwtPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'USER',
    };

    it('should validate and return user data for valid payload', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        status: 1,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(usersService.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException if account is blocked', async () => {
      const blockedUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        status: 0, // blocked
      };

      mockUsersService.findById.mockResolvedValue(blockedUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'Account is blocked',
      );
    });

    it('should validate admin users', async () => {
      const adminPayload: JwtPayload = {
        sub: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
      };

      const mockAdmin = {
        id: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        status: 1,
      };

      mockUsersService.findById.mockResolvedValue(mockAdmin);

      const result = await strategy.validate(adminPayload);

      expect(result.role).toBe('ADMIN');
    });

    it('should handle user with different status values', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        status: 2, // some other status
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'Account is blocked',
      );
    });

    it('should return correct user structure', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'another@example.com',
        username: 'anotheruser',
        role: 'USER',
        status: 1,
        password: 'hashed_password', // should not be included in result
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate({
        sub: 'user-456',
        email: 'another@example.com',
        username: 'anotheruser',
        role: 'USER',
      });

      expect(result).toEqual({
        id: 'user-456',
        email: 'another@example.com',
        username: 'anotheruser',
        role: 'USER',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('status');
    });
  });

  describe('configuration', () => {
    it('should use JWT_SECRET from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
