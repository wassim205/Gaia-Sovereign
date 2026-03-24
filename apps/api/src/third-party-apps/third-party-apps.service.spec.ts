import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ThirdPartyAppsService } from './third-party-apps.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/auth/services/password.service';

describe('ThirdPartyAppsService', () => {
  let service: ThirdPartyAppsService;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const mockPrismaService = {
    thirdPartyApp: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPasswordService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThirdPartyAppsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<ThirdPartyAppsService>(ThirdPartyAppsService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GS-68: Secret Storage Security', () => {
    it('should store client secret as hash, not plaintext', async () => {
      const ownerId = 'user-123';
      const dto = {
        name: 'Test App',
        description: 'Test Description',
        redirectUris: ['https://example.com/callback'],
      };

      const hashedSecret = '$argon2id$v=19$m=65536,t=3,p=4$hashed';
      mockPasswordService.hashPassword.mockResolvedValue(hashedSecret);

      const mockApp = {
        id: 'app-123',
        ownerId,
        name: dto.name,
        description: dto.description,
        clientId: 'gsa_test123',
        status: 'ACTIVE',
        redirectUris: dto.redirectUris,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.thirdPartyApp.create.mockResolvedValue(mockApp);

      const result = await service.create(ownerId, dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        expect.stringMatching(/^gss_/),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.thirdPartyApp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            secretHash: hashedSecret,
          }),
        }),
      );
      expect(result.clientSecret).toMatch(/^gss_/);
      expect(result.app).not.toHaveProperty('secretHash');
    });

    it('should return plaintext secret only once during creation', async () => {
      const ownerId = 'user-123';
      const dto = {
        name: 'Test App',
        description: 'Test',
        redirectUris: ['https://example.com/callback'],
      };

      mockPasswordService.hashPassword.mockResolvedValue('hashed');
      mockPrismaService.thirdPartyApp.create.mockResolvedValue({
        id: 'app-123',
        ownerId,
        name: dto.name,
        description: dto.description,
        clientId: 'gsa_test',
        status: 'ACTIVE',
        redirectUris: dto.redirectUris,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(ownerId, dto);

      expect(result.clientSecret).toBeDefined();
      expect(result.clientSecret).toMatch(/^gss_/);
      expect(result.app).not.toHaveProperty('secretHash');
    });

    it('should not expose secret hash in findAll results', async () => {
      const ownerId = 'user-123';
      const mockApps = [
        {
          id: 'app-1',
          ownerId,
          name: 'App 1',
          description: 'Desc 1',
          clientId: 'gsa_1',
          status: 'ACTIVE',
          redirectUris: ['https://example.com'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.thirdPartyApp.findMany.mockResolvedValue(mockApps);

      const result = await service.findAll(ownerId);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('secretHash');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.thirdPartyApp.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({
            secretHash: true,
          }),
        }),
      );
    });

    it('should generate new hash when rotating secret', async () => {
      const appId = 'app-123';
      const ownerId = 'user-123';
      const oldHash = '$argon2id$old';
      const newHash = '$argon2id$new';

      mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
        id: appId,
        ownerId,
        secretHash: oldHash,
      });

      mockPasswordService.hashPassword.mockResolvedValue(newHash);

      mockPrismaService.thirdPartyApp.update.mockResolvedValue({
        id: appId,
        ownerId,
        name: 'Test App',
        description: 'Test',
        clientId: 'gsa_test',
        status: 'ACTIVE',
        redirectUris: ['https://example.com'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.rotateSecret(appId, ownerId);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        expect.stringMatching(/^gss_/),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.thirdPartyApp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            secretHash: newHash,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            secretRotatedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.clientSecret).toMatch(/^gss_/);
      expect(result.app).not.toHaveProperty('secretHash');
    });

    it('should throw NotFoundException when rotating secret for non-existent app', async () => {
      mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue(null);

      await expect(
        service.rotateSecret('non-existent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
