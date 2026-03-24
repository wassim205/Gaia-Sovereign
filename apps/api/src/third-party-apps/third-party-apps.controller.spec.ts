import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThirdPartyAppsController } from './third-party-apps.controller';
import { ThirdPartyAppsService } from './third-party-apps.service';
import { AppOwnerOrAdminGuard } from './guards/app-owner-or-admin.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

describe('ThirdPartyAppsController', () => {
  let controller: ThirdPartyAppsController;
  let service: ThirdPartyAppsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    rotateSecret: jest.fn(),
    changeStatus: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaService = {
    thirdPartyApp: {
      findFirst: jest.fn(),
    },
  };

  const mockUser: CurrentUserData = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
  };

  const mockApp = {
    id: 'app-123',
    ownerId: 'user-123',
    name: 'Test App',
    description: 'Test Description',
    clientId: 'gsa_test123',
    status: 'ACTIVE' as const,
    redirectUris: ['https://example.com/callback'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThirdPartyAppsController],
      providers: [
        { provide: ThirdPartyAppsService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrismaService },
        Reflector,
        AppOwnerOrAdminGuard,
      ],
    }).compile();

    controller = module.get<ThirdPartyAppsController>(
      ThirdPartyAppsController,
    );
    service = module.get<ThirdPartyAppsService>(ThirdPartyAppsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GS-76: Management Endpoints and Permissions', () => {
    describe('POST /third-party-apps', () => {
      it('should create app for authenticated user', async () => {
        const dto = {
          name: 'New App',
          description: 'Description',
          redirectUris: ['https://example.com/callback'],
        };

        mockService.create.mockResolvedValue({
          app: mockApp,
          clientSecret: 'gss_secret123',
        });

        const result = await controller.create(mockUser, dto);

        expect(service.create).toHaveBeenCalledWith(mockUser.id, dto);
        expect(result.data).toHaveProperty('clientSecret');
        expect(result.message).toContain('created successfully');
      });
    });

    describe('GET /third-party-apps', () => {
      it('should return only apps owned by current user', async () => {
        const apps = [mockApp];
        mockService.findAll.mockResolvedValue(apps);

        const result = await controller.findAll(mockUser);

        expect(service.findAll).toHaveBeenCalledWith(mockUser.id);
        expect(result.data).toEqual(apps);
      });

      it('should not return apps from other users', async () => {
        mockService.findAll.mockResolvedValue([]);

        const result = await controller.findAll(mockUser);

        expect(result.data).toHaveLength(0);
      });
    });

    describe('PATCH /third-party-apps/:id/rotate-secret', () => {
      it('should allow owner to rotate secret', async () => {
        mockService.rotateSecret.mockResolvedValue({
          app: mockApp,
          clientSecret: 'gss_newsecret456',
        });

        const result = await controller.rotateSecret(mockUser, 'app-123');

        expect(service.rotateSecret).toHaveBeenCalledWith(
          'app-123',
          mockUser.id,
        );
        expect(result.data).toHaveProperty('clientSecret');
        expect(result.message).toContain('rotated successfully');
      });

      it('should reject rotation for non-owner', async () => {
        mockService.rotateSecret.mockRejectedValue(
          new NotFoundException('App not found or access denied'),
        );

        await expect(
          controller.rotateSecret(mockUser, 'other-app'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('PATCH /third-party-apps/:id/status', () => {
      it('should allow owner to change status to BLOCKED', async () => {
        const blockedApp = { ...mockApp, status: 'BLOCKED' as const };
        mockService.changeStatus.mockResolvedValue(blockedApp);

        const result = await controller.changeStatus(mockUser, 'app-123', {
          status: 'BLOCKED',
        });

        expect(service.changeStatus).toHaveBeenCalledWith(
          'app-123',
          mockUser.id,
          'BLOCKED',
        );
        expect(result.data.status).toBe('BLOCKED');
      });

      it('should allow owner to change status to ACTIVE', async () => {
        mockService.changeStatus.mockResolvedValue(mockApp);

        const result = await controller.changeStatus(mockUser, 'app-123', {
          status: 'ACTIVE',
        });

        expect(service.changeStatus).toHaveBeenCalledWith(
          'app-123',
          mockUser.id,
          'ACTIVE',
        );
        expect(result.data.status).toBe('ACTIVE');
      });

      it('should reject status change for non-owner', async () => {
        mockService.changeStatus.mockRejectedValue(
          new ForbiddenException('App not found or access denied'),
        );

        await expect(
          controller.changeStatus(mockUser, 'other-app', {
            status: 'BLOCKED',
          }),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('PATCH /third-party-apps/:id', () => {
      it('should allow owner to update app details', async () => {
        const dto = {
          name: 'Updated Name',
          description: 'Updated Description',
          redirectUris: ['https://new.example.com/callback'],
        };

        const updatedApp = { ...mockApp, ...dto };
        mockService.update.mockResolvedValue(updatedApp);

        const result = await controller.update(mockUser, 'app-123', dto);

        expect(service.update).toHaveBeenCalledWith(
          'app-123',
          mockUser.id,
          dto,
        );
        expect(result.data.name).toBe(dto.name);
        expect(result.data.redirectUris).toEqual(dto.redirectUris);
      });

      it('should reject update for non-owner', async () => {
        mockService.update.mockRejectedValue(
          new ForbiddenException('App not found or access denied'),
        );

        await expect(
          controller.update(mockUser, 'other-app', {
            name: 'Hacked',
            redirectUris: ['https://evil.com'],
          }),
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
