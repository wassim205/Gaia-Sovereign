/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditLogService } from './services/audit-log.service';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditLogService;

  const mockService = {
    getAuditLogs: jest.fn(),
    getAuditStats: jest.fn(),
  };

  const mockUser: CurrentUserData = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditLogService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GS-124: Audit Logging Tests', () => {
    describe('getLogs', () => {
      it('should retrieve audit logs with default pagination', async () => {
        const mockLogs = {
          data: [
            {
              id: 'log-1',
              userId: mockUser.id,
              action: 'VAULT_READ',
              timestamp: new Date(),
            },
          ],
          meta: { total: 1, limit: 50, offset: 0 },
        };

        mockService.getAuditLogs.mockResolvedValue(mockLogs);

        const result = await controller.getLogs(mockUser, {});

        expect(service.getAuditLogs).toHaveBeenCalledWith(mockUser.id, {
          userId: mockUser.id,
          appId: undefined,
          action: undefined,
          field: undefined,
          status: undefined,
          from: undefined,
          to: undefined,
          limit: 50,
          offset: 0,
        });
        expect(result.message).toContain('retrieved successfully');
        expect(result.data).toEqual(mockLogs.data);
        expect(result.meta.total).toBe(1);
      });

      it('should filter logs by date range', async () => {
        const from = '2024-01-01T00:00:00Z';
        const to = '2024-12-31T23:59:59Z';

        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 0, limit: 50, offset: 0 },
        });

        await controller.getLogs(mockUser, { from, to });

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            from: new Date(from),
            to: new Date(to),
          }),
        );
      });

      it('should filter logs by app', async () => {
        const appId = 'app-123';

        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 0, limit: 50, offset: 0 },
        });

        await controller.getLogs(mockUser, { app: appId });

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            appId,
          }),
        );
      });

      it('should filter logs by action', async () => {
        const action = 'CONSENT_APPROVE';

        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 0, limit: 50, offset: 0 },
        });

        await controller.getLogs(mockUser, { action });

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            action,
          }),
        );
      });

      it('should filter logs by field', async () => {
        const field = 'email';

        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 0, limit: 50, offset: 0 },
        });

        await controller.getLogs(mockUser, { field });

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            field,
          }),
        );
      });

      it('should filter logs by status', async () => {
        const status = 'success';

        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 0, limit: 50, offset: 0 },
        });

        await controller.getLogs(mockUser, { status });

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            status,
          }),
        );
      });

      it('should support custom pagination', async () => {
        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 100, limit: 20, offset: 40 },
        });

        await controller.getLogs(mockUser, { limit: 20, offset: 40 });

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            limit: 20,
            offset: 40,
          }),
        );
      });

      it('should combine multiple filters', async () => {
        const query = {
          app: 'app-123',
          action: 'VAULT_READ',
          field: 'email',
          status: 'success',
          from: '2024-01-01T00:00:00Z',
          to: '2024-12-31T23:59:59Z',
          limit: 10,
          offset: 0,
        };

        mockService.getAuditLogs.mockResolvedValue({
          data: [],
          meta: { total: 0, limit: 10, offset: 0 },
        });

        await controller.getLogs(mockUser, query);

        expect(service.getAuditLogs).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            appId: query.app,
            action: query.action,
            field: query.field,
            status: query.status,
            from: new Date(query.from),
            to: new Date(query.to),
            limit: query.limit,
            offset: query.offset,
          }),
        );
      });
    });

    describe('getStats', () => {
      it('should retrieve audit statistics', async () => {
        const mockStats = {
          totalLogs: 150,
          byAction: {
            VAULT_READ: 100,
            CONSENT_APPROVE: 30,
            TOKEN_REVOKE: 20,
          },
          byApp: {
            'app-1': 80,
            'app-2': 70,
          },
          byStatus: {
            success: 145,
            error: 5,
          },
        };

        mockService.getAuditStats.mockResolvedValue(mockStats);

        const result = await controller.getStats(mockUser);

        expect(service.getAuditStats).toHaveBeenCalledWith(mockUser.id, 30);
        expect(result.message).toContain('retrieved successfully');
        expect(result.data).toEqual(mockStats);
        expect(result.period).toBe('30 days');
      });
    });
  });
});
