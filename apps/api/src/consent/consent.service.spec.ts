import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/auth/services/password.service';
import { TokenService } from 'src/tokens/token.service';
import { AuditLogService } from 'src/audit/services/audit-log.service';

describe('ConsentService', () => {
  let service: ConsentService;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let auditLogService: AuditLogService;

  const mockPrismaService = {
    consentRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    thirdPartyApp: {
      findFirst: jest.fn(),
    },
  };

  const mockPasswordService = {
    verifyPassword: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn(),
  };

  const mockAuditLogService = {
    createAuditLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
    prisma = module.get<PrismaService>(PrismaService);
    tokenService = module.get<TokenService>(TokenService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GS-91: Approve/Deny Flows and Redirect Handling', () => {
    const userId = 'user-123';
    const appId = 'app-123';
    const consentId = 'consent-123';

    describe('approveConsent', () => {
      it('should approve consent and generate access token', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          requestedFields: ['email', 'name'],
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );
        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'APPROVED',
          requestedFields: ['email', 'name'],
          redirectUri: 'https://example.com/callback',
          state: 'state123',
          appId,
        });

        mockTokenService.generateAccessToken.mockResolvedValue({
          token: 'access_token_123',
          expiresAt: new Date(),
        });

        const result = await service.approveConsent(consentId, userId, {
          approvedFields: ['email', 'name'],
        });

        expect(result.status).toBe('APPROVED');
        expect(result.accessToken).toBe('access_token_123');
        expect(result.redirectUri).toBe('https://example.com/callback');
        expect(result.state).toBe('state123');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(auditLogService.createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CONSENT_APPROVE',
            resourceType: 'CONSENT_REQUEST',
          }),
        );
      });

      it('should approve with subset of requested fields', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          requestedFields: ['email', 'name', 'phone'],
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );
        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'APPROVED',
          requestedFields: ['email', 'name'],
          redirectUri: 'https://example.com/callback',
          state: null,
          appId,
        });

        mockTokenService.generateAccessToken.mockResolvedValue({
          token: 'token',
          expiresAt: new Date(),
        });

        const result = await service.approveConsent(consentId, userId, {
          approvedFields: ['email', 'name'],
        });

        expect(result.status).toBe('APPROVED');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
          expect.objectContaining({
            approvedFields: ['email', 'name'],
          }),
        );
      });

      it('should reject approval with fields not in requested list', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          requestedFields: ['email'],
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );

        await expect(
          service.approveConsent(consentId, userId, {
            approvedFields: ['email', 'phone'],
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject approval by non-owner', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          requestedFields: ['email'],
          app: { ownerId: 'other-user' },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );

        await expect(
          service.approveConsent(consentId, userId, {
            approvedFields: ['email'],
          }),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should reject approval of already processed consent', async () => {
        const mockConsent = {
          id: consentId,
          status: 'APPROVED',
          requestedFields: ['email'],
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );

        await expect(
          service.approveConsent(consentId, userId, {
            approvedFields: ['email'],
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should include state parameter in response', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          requestedFields: ['email'],
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );
        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'APPROVED',
          requestedFields: ['email'],
          redirectUri: 'https://example.com/callback',
          state: 'csrf_token_xyz',
          appId,
        });

        mockTokenService.generateAccessToken.mockResolvedValue({
          token: 'token',
          expiresAt: new Date(),
        });

        const result = await service.approveConsent(consentId, userId, {
          approvedFields: ['email'],
        });

        expect(result.state).toBe('csrf_token_xyz');
      });
    });

    describe('denyConsent', () => {
      it('should deny consent and update status', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique
          .mockResolvedValueOnce(mockConsent)
          .mockResolvedValueOnce({
            appId,
            requestedFields: ['email'],
          });

        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'REJECTED',
          redirectUri: 'https://example.com/callback',
          state: 'state123',
        });

        const result = await service.denyConsent(consentId, userId);

        expect(result.status).toBe('REJECTED');
        expect(result.redirectUri).toBe('https://example.com/callback');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(auditLogService.createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CONSENT_DENY',
            resourceType: 'CONSENT_REQUEST',
          }),
        );
      });

      it('should reject denial by non-owner', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          app: { ownerId: 'other-user' },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );

        await expect(service.denyConsent(consentId, userId)).rejects.toThrow(
          ForbiddenException,
        );
      });

      it('should reject denial of already processed consent', async () => {
        const mockConsent = {
          id: consentId,
          status: 'REJECTED',
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );

        await expect(service.denyConsent(consentId, userId)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should include state in denial response for redirect', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique
          .mockResolvedValueOnce(mockConsent)
          .mockResolvedValueOnce({
            appId,
            requestedFields: [],
          });

        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'REJECTED',
          redirectUri: 'https://example.com/callback',
          state: 'csrf_state',
        });

        const result = await service.denyConsent(consentId, userId);

        expect(result.state).toBe('csrf_state');
      });
    });

    describe('redirect handling', () => {
      it('should return redirect URI for approved consent', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          requestedFields: ['email'],
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique.mockResolvedValue(
          mockConsent,
        );
        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'APPROVED',
          requestedFields: ['email'],
          redirectUri: 'https://app.example.com/oauth/callback',
          state: 'state',
          appId,
        });

        mockTokenService.generateAccessToken.mockResolvedValue({
          token: 'token',
          expiresAt: new Date(),
        });

        const result = await service.approveConsent(consentId, userId, {
          approvedFields: ['email'],
        });

        expect(result.redirectUri).toBe(
          'https://app.example.com/oauth/callback',
        );
      });

      it('should return redirect URI for denied consent', async () => {
        const mockConsent = {
          id: consentId,
          status: 'PENDING',
          app: { ownerId: userId },
        };

        mockPrismaService.consentRequest.findUnique
          .mockResolvedValueOnce(mockConsent)
          .mockResolvedValueOnce({ appId, requestedFields: [] });

        mockPrismaService.consentRequest.update.mockResolvedValue({
          id: consentId,
          status: 'REJECTED',
          redirectUri: 'https://app.example.com/oauth/callback',
          state: null,
        });

        const result = await service.denyConsent(consentId, userId);

        expect(result.redirectUri).toBe(
          'https://app.example.com/oauth/callback',
        );
      });
    });
  });

  describe('GS-83: Invalid Clients, Bad Redirect URIs, Malformed Fields', () => {
    describe('createConsentRequest', () => {
      it('should reject request with invalid client credentials', async () => {
        const dto = {
          clientId: 'gsa_invalid',
          clientSecret: 'wrong_secret',
          redirectUri: 'https://example.com/callback',
          requestedFields: ['email'],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
          secretHash: 'hashed_secret',
          redirectUris: [dto.redirectUri],
        });

        mockPasswordService.verifyPassword.mockResolvedValue(false);

        await expect(service.createConsentRequest(dto)).rejects.toThrow(
          'Invalid client credentials',
        );
      });

      it('should reject request for non-existent client', async () => {
        const dto = {
          clientId: 'gsa_nonexistent',
          clientSecret: 'secret',
          redirectUri: 'https://example.com/callback',
          requestedFields: ['email'],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue(null);

        await expect(service.createConsentRequest(dto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should reject request for inactive/blocked app', async () => {
        const dto = {
          clientId: 'gsa_blocked',
          clientSecret: 'secret',
          redirectUri: 'https://example.com/callback',
          requestedFields: ['email'],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue(null);

        await expect(service.createConsentRequest(dto)).rejects.toThrow(
          'App not found or inactive',
        );
      });

      it('should reject unregistered redirect URI', async () => {
        const dto = {
          clientId: 'gsa_test',
          clientSecret: 'secret',
          redirectUri: 'https://evil.com/steal',
          requestedFields: ['email'],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
          secretHash: 'hashed',
          redirectUris: ['https://example.com/callback'],
        });

        mockPasswordService.verifyPassword.mockResolvedValue(true);

        await expect(service.createConsentRequest(dto)).rejects.toThrow(
          'Redirect URI is not registered',
        );
      });

      it('should reject request with empty fields array', async () => {
        const dto = {
          clientId: 'gsa_test',
          clientSecret: 'secret',
          redirectUri: 'https://example.com/callback',
          requestedFields: [],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
          secretHash: 'hashed',
          redirectUris: [dto.redirectUri],
        });

        mockPasswordService.verifyPassword.mockResolvedValue(true);

        await expect(service.createConsentRequest(dto)).rejects.toThrow(
          'At least one field must be requested',
        );
      });

      it('should normalize and deduplicate requested fields', async () => {
        const dto = {
          clientId: 'gsa_test',
          clientSecret: 'secret',
          redirectUri: 'https://example.com/callback',
          requestedFields: ['Email', 'NAME', 'email', ' name '],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
          secretHash: 'hashed',
          redirectUris: [dto.redirectUri],
        });

        mockPasswordService.verifyPassword.mockResolvedValue(true);

        mockPrismaService.consentRequest.create.mockResolvedValue({
          id: 'consent-123',
          appId: 'app-123',
          redirectUri: dto.redirectUri,
          requestedFields: ['email', 'name'],
          expiresAt: new Date(),
          status: 'PENDING',
          state: null,
          createdAt: new Date(),
        });

        const result = await service.createConsentRequest(dto);

        expect(result.consentRequest.requestedFields).toEqual([
          'email',
          'name',
        ]);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(prisma.consentRequest.create).toHaveBeenCalledWith(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: expect.objectContaining({
              requestedFields: ['email', 'name'],
            }),
          }),
        );
      });

      it('should filter out empty/whitespace fields', async () => {
        const dto = {
          clientId: 'gsa_test',
          clientSecret: 'secret',
          redirectUri: 'https://example.com/callback',
          requestedFields: ['email', '', '  ', 'name'],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
          secretHash: 'hashed',
          redirectUris: [dto.redirectUri],
        });

        mockPasswordService.verifyPassword.mockResolvedValue(true);

        mockPrismaService.consentRequest.create.mockResolvedValue({
          id: 'consent-123',
          appId: 'app-123',
          redirectUri: dto.redirectUri,
          requestedFields: ['email', 'name'],
          expiresAt: new Date(),
          status: 'PENDING',
          state: null,
          createdAt: new Date(),
        });

        const result = await service.createConsentRequest(dto);

        expect(result.consentRequest.requestedFields).toEqual([
          'email',
          'name',
        ]);
      });

      it('should accept valid redirect URI from registered list', async () => {
        const dto = {
          clientId: 'gsa_test',
          clientSecret: 'secret',
          redirectUri: 'https://app.example.com/oauth/callback',
          requestedFields: ['email'],
        };

        mockPrismaService.thirdPartyApp.findFirst.mockResolvedValue({
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
          secretHash: 'hashed',
          redirectUris: [
            'https://example.com/callback',
            'https://app.example.com/oauth/callback',
          ],
        });

        mockPasswordService.verifyPassword.mockResolvedValue(true);

        mockPrismaService.consentRequest.create.mockResolvedValue({
          id: 'consent-123',
          appId: 'app-123',
          redirectUri: dto.redirectUri,
          requestedFields: ['email'],
          expiresAt: new Date(),
          status: 'PENDING',
          state: null,
          createdAt: new Date(),
        });

        const result = await service.createConsentRequest(dto);

        expect(result.consentRequest.redirectUri).toBe(dto.redirectUri);
      });
    });
  });
});
