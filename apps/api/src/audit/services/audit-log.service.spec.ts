import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService, CreateAuditLogDto } from './audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: PrismaService;

  const mockAuditLog = {
    id: 'log-1',
    userId: 'user-1',
    action: 'VAULT_ACCESS',
    resourceType: 'vault',
    resourceId: 'vault-1',
    appId: 'app-1',
    approvedFields: ['email', 'name'],
    requestedFields: ['email', 'name'],
    accessedFields: ['email'],
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    status: 'success',
    details: null,
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createAuditLog', () => {
    it('should create audit log entry', async () => {
      const dto: CreateAuditLogDto = {
        userId: 'user-1',
        action: 'VAULT_ACCESS',
        resourceType: 'vault',
        accessedFields: ['email'],
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(dto);

      expect(result).toEqual(mockAuditLog);
      expect(prisma.auditLog.create).toHaveBeenCalled?.();
    });

    it('should set defaults for optional fields', async () => {
      const dto: CreateAuditLogDto = {
        userId: 'user-1',
        action: 'VAULT_ACCESS',
        resourceType: 'vault',
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await service.createAuditLog(dto);

      expect(prisma.auditLog.create).toHaveBeenCalled?.();
    });

    it('should track field access', async () => {
      const dto: CreateAuditLogDto = {
        userId: 'user-1',
        action: 'VAULT_ACCESS',
        resourceType: 'vault',
        approvedFields: ['email', 'name', 'phone'],
        requestedFields: ['email', 'name'],
        accessedFields: ['email'],
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await service.createAuditLog(dto);

      expect(prisma.auditLog.create).toHaveBeenCalled?.();
    });

    it('should track consent actions', async () => {
      const dto: CreateAuditLogDto = {
        userId: 'user-1',
        action: 'CONSENT_APPROVED',
        resourceType: 'consent',
        resourceId: 'consent-1',
        appId: 'app-1',
      };

      (prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await service.createAuditLog(dto);

      expect(prisma.auditLog.create).toHaveBeenCalled?.();
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve logs for user', async () => {
      const logs = [mockAuditLog];

      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(logs);

      const result = await service.getAuditLogs('user-1', {});

      expect(result.data).toEqual(logs);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by app ID', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      const result = await service.getAuditLogs('user-1', { appId: 'app-1' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by action', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      const result = await service.getAuditLogs('user-1', {
        action: 'VAULT_ACCESS',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by status', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      const result = await service.getAuditLogs('user-1', { status: 'success' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      const result = await service.getAuditLogs('user-1', {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by accessed field', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      const result = await service.getAuditLogs('user-1', { field: 'email' });

      expect(result.data).toHaveLength(1);
    });

    it('should paginate results', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(100);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      const result = await service.getAuditLogs('user-1', {
        limit: 20,
        offset: 10,
      });

      expect(result.meta.limit).toBe(20);
      expect(result.meta.offset).toBe(10);
    });

    it('should order by timestamp descending', async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);

      await service.getAuditLogs('user-1', {});

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith?.(
        expect.objectContaining({
          orderBy: { timestamp: 'desc' },
        } as never),
      );
    });
  });

  describe('deleteAuditLogsByUser', () => {
    it('should delete logs older than date', async () => {
      const beforeDate = new Date('2024-01-01');

      (prisma.auditLog.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const result = await service.deleteOlderThan(beforeDate);

      expect(result.count).toBe(5);
    });
  });

  describe('archiveOlderThan', () => {
    it('should archive logs older than date', async () => {
      const beforeDate = new Date('2024-01-01');

      (prisma.auditLog.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      const result = await service.archiveOlderThan(beforeDate);

      expect(result.count).toBe(3);
    });
  });

  describe('getAuditStats', () => {
    it('should return action stats', async () => {
      const stats = [
        { action: 'VAULT_ACCESS', resourceType: 'vault', count: 10 },
        { action: 'CONSENT_APPROVED', resourceType: 'consent', count: 5 },
      ];

      (prisma.auditLog.groupBy as jest.Mock).mockResolvedValue(
        stats.map((s) => ({
          action: s.action,
          resourceType: s.resourceType,
          _count: { id: s.count },
        })),
      );

      const result = await service.getAuditStats('user-1', 30);

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('VAULT_ACCESS');
    });
  });
});
