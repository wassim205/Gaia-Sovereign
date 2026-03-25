import { Test, TestingModule } from '@nestjs/testing';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

describe('ConsentController', () => {
  let controller: ConsentController;
  let service: ConsentService;

  const mockService = {
    createConsentRequest: jest.fn(),
    getConsentDetail: jest.fn(),
    approveConsent: jest.fn(),
    denyConsent: jest.fn(),
  };

  const mockUser: CurrentUserData = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentController],
      providers: [{ provide: ConsentService, useValue: mockService }],
    }).compile();

    controller = module.get<ConsentController>(ConsentController);
    service = module.get<ConsentService>(ConsentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should create consent request', async () => {
      const dto = {
        clientId: 'gsa_test',
        clientSecret: 'secret',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email', 'name'],
      };

      const mockResult = {
        consentRequest: {
          id: 'consent-123',
          appId: 'app-123',
          redirectUri: dto.redirectUri,
          requestedFields: dto.requestedFields,
          expiresAt: new Date(),
          status: 'PENDING' as const,
          state: null,
          createdAt: new Date(),
        },
        app: {
          id: 'app-123',
          name: 'Test App',
          clientId: dto.clientId,
        },
      };

      mockService.createConsentRequest.mockResolvedValue(mockResult);

      const result = await controller.createRequest(dto);

      expect(service.createConsentRequest).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('created successfully');
      expect(result.data.consentRequest.id).toBe('consent-123');
      expect(result.data.app.name).toBe('Test App');
    });
  });

  describe('getConsentDetail', () => {
    it('should return consent details', async () => {
      const consentId = 'consent-123';
      const mockConsent = {
        id: consentId,
        appId: 'app-123',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email'],
        status: 'PENDING' as const,
        expiresAt: new Date(),
        state: null,
        createdAt: new Date(),
        app: {
          id: 'app-123',
          name: 'Test App',
          description: 'Test',
          ownerId: mockUser.id,
        },
      };

      mockService.getConsentDetail.mockResolvedValue(mockConsent);

      const result = await controller.getConsentDetail(consentId, mockUser);

      expect(service.getConsentDetail).toHaveBeenCalledWith(
        consentId,
        mockUser.id,
      );
      expect(result.data.id).toBe(consentId);
    });
  });

  describe('approveConsent', () => {
    it('should approve consent request', async () => {
      const consentId = 'consent-123';
      const dto = { approvedFields: ['email', 'name'] };

      const mockResult = {
        id: consentId,
        status: 'APPROVED' as const,
        requestedFields: dto.approvedFields,
        redirectUri: 'https://example.com/callback',
        state: 'state123',
        accessToken: 'token_abc',
        tokenExpiresAt: new Date(),
      };

      mockService.approveConsent.mockResolvedValue(mockResult);

      const result = await controller.approveConsent(consentId, dto, mockUser);

      expect(service.approveConsent).toHaveBeenCalledWith(
        consentId,
        mockUser.id,
        dto,
      );
      expect(result.message).toContain('approved successfully');
      expect(result.data.accessToken).toBe('token_abc');
    });
  });

  describe('denyConsent', () => {
    it('should deny consent request', async () => {
      const consentId = 'consent-123';

      const mockResult = {
        id: consentId,
        status: 'REJECTED' as const,
        redirectUri: 'https://example.com/callback',
        state: 'state123',
      };

      mockService.denyConsent.mockResolvedValue(mockResult);

      const result = await controller.denyConsent(consentId, mockUser);

      expect(service.denyConsent).toHaveBeenCalledWith(consentId, mockUser.id);
      expect(result.message).toContain('denied successfully');
      expect(result.data.status).toBe('REJECTED');
    });
  });
});
