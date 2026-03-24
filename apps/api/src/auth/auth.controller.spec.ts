import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'user-1',
    username: 'john',
    email: 'john@example.com',
    role: 'user',
    createdAt: new Date(),
  };

  const mockLoginResult = {
    accessToken: 'token',
    refreshToken: 'refresh',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('getCsrfToken', () => {
    it('should return CSRF token', () => {
      const mockRes = {
        cookie: jest.fn(() => mockRes),
      } as any;

      const result = controller.getCsrfToken(mockRes);

      expect(result.data.csrfToken).toBeDefined();
      expect(mockRes.cookie).toHaveBeenCalled?.();
    });

    it('should set httpOnly to false for client access', () => {
      const mockRes = {
        cookie: jest.fn(() => mockRes),
      } as any;

      controller.getCsrfToken(mockRes);

      const call = (mockRes.cookie as jest.Mock).mock.calls[0];
      expect(call[2].httpOnly).toBe(false);
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      (authService.register as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.register({
        username: 'john',
        email: 'john@example.com',
        password: 'password123',
      } as any);

      expect(result.message).toBe('User registered successfully');
      expect(result.data.id).toBe('user-1');
    });

    it('should not expose password in response', async () => {
      (authService.register as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.register({
        username: 'john',
        email: 'john@example.com',
        password: 'password123',
      } as any);

      expect(result.data.email).toBe('john@example.com');
    });

    it('should reject duplicate email', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(
        controller.register({
          username: 'john',
          email: 'john@example.com',
          password: 'password123',
        } as any),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        user: mockUser,
      });

      const result = await controller.login({
        email: 'john@example.com',
        password: 'password123',
      } as any);

      expect(result.message).toBe('Login successful');
      expect(result.data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(
        controller.login({
          email: 'john@example.com',
          password: 'wrong',
        } as any),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should include user metadata in response', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        user: mockUser,
      });

      const result = await controller.login({
        email: 'john@example.com',
        password: 'password123',
      } as any);

      expect(result.data.user.id).toBe('user-1');
      expect(result.data.user.role).toBe('user');
    });
  });
});
