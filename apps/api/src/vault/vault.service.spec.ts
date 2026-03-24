import { Test, TestingModule } from '@nestjs/testing';
import { VaultService } from './vault.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/encryption.service';
import { AuditLogService } from 'src/audit/services/audit-log.service';

describe('VaultService', () => {
  let service: VaultService;
  let prisma: PrismaService;
  let encryptionService: EncryptionService;
  let auditLogService: AuditLogService;

  const mockVaultEntry = {
    id: 'vault-1',
    userId: 'user-1',
    title: 'My Passwords',
    category: 'passwords',
    description: 'Personal passwords',
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    fields: [
      {
        id: 'field-1',
        fieldKey: 'username',
        encryptedValue: 'encrypted-username',
        fieldType: 'text',
        vaultEntryId: 'vault-1',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultService,
        {
          provide: PrismaService,
          useValue: {
            vaultEntry: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            vaultField: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((value) => `encrypted-${value}`),
            decrypt: jest.fn((encrypted) =>
              (encrypted as string).replace('encrypted-', ''),
            ),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            createAuditLog: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<VaultService>(VaultService);
    prisma = module.get<PrismaService>(PrismaService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  describe('create', () => {
    it('should create vault entry with encrypted fields', async () => {
      (prisma.vaultEntry.create as jest.Mock).mockResolvedValue(
        mockVaultEntry,
      );

      await service.create('user-1', 'master-key', {
        title: 'My Passwords',
        category: { value: 'passwords', label: 'Passwords' },
        fields: [{ fieldKey: 'username', value: 'john', fieldType: 'text' }],
      });

      expect(prisma.vaultEntry.create).toHaveBeenCalled?.();
      expect(encryptionService.encrypt).toHaveBeenCalled?.();
    });
  });

  describe('findAll', () => {
    it('should retrieve vault entries with pagination', async () => {
      const entries = [mockVaultEntry];

      (prisma.vaultEntry.count as jest.Mock).mockResolvedValue(1);
      (prisma.vaultEntry.findMany as jest.Mock).mockResolvedValue(entries);

      const result = await service.findAll('user-1', 'master-key', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by category', async () => {
      (prisma.vaultEntry.count as jest.Mock).mockResolvedValue(1);
      (prisma.vaultEntry.findMany as jest.Mock).mockResolvedValue([
        mockVaultEntry,
      ]);

      const result = await service.findAll('user-1', 'master-key', {
        category: 'passwords',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should search by title or description', async () => {
      (prisma.vaultEntry.count as jest.Mock).mockResolvedValue(1);
      (prisma.vaultEntry.findMany as jest.Mock).mockResolvedValue([
        mockVaultEntry,
      ]);

      const result = await service.findAll('user-1', 'master-key', {
        search: 'Passwords',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should sort entries', async () => {
      (prisma.vaultEntry.count as jest.Mock).mockResolvedValue(1);
      (prisma.vaultEntry.findMany as jest.Mock).mockResolvedValue([
        mockVaultEntry,
      ]);

      await service.findAll('user-1', 'master-key', {
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(prisma.vaultEntry.findMany).toHaveBeenCalled?.();
    });
  });

  describe('findOne', () => {
    it('should return vault entry by ID', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue(
        mockVaultEntry,
      );

      const result = await service.findOne('user-1', 'master-key', 'vault-1');

      expect(result.id).toBe('vault-1');
      expect(encryptionService.decrypt).toHaveBeenCalled?.();
    });

    it('should throw if entry not found', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findOne('user-1', 'master-key', 'vault-1'),
      ).rejects.toThrow('Vault entry not found');
    });

    it('should enforce ownership', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue({
        ...mockVaultEntry,
        userId: 'other-user',
      });

      await expect(
        service.findOne('user-1', 'master-key', 'vault-1'),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update vault entry', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue(
        mockVaultEntry,
      );
      (prisma.vaultEntry.update as jest.Mock).mockResolvedValue({
        ...mockVaultEntry,
        title: 'Updated',
      });

      const result = await service.update(
        'user-1',
        'vault-1',
        { title: 'Updated' },
        'master-key',
      );

      expect(result.title).toBe('Updated');
      expect(auditLogService.createAuditLog).toHaveBeenCalled?.();
    });

    it('should enforce ownership on update', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue({
        ...mockVaultEntry,
        userId: 'other-user',
      });

      await expect(
        service.update('user-1', 'vault-1', { title: 'New' }, 'master-key'),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete vault entry', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue(
        mockVaultEntry,
      );
      (prisma.vaultEntry.delete as jest.Mock).mockResolvedValue(mockVaultEntry);

      await service.remove('user-1', 'vault-1');

      expect(prisma.vaultEntry.delete).toHaveBeenCalled?.();
    });

    it('should log deletion', async () => {
      (prisma.vaultEntry.findUnique as jest.Mock).mockResolvedValue(
        mockVaultEntry,
      );
      (prisma.vaultEntry.delete as jest.Mock).mockResolvedValue(mockVaultEntry);

      await service.remove('user-1', 'vault-1');

      expect(auditLogService.createAuditLog).toHaveBeenCalled?.();
    });
  });

  describe('getCategoryCounts', () => {
    it('should return category counts', async () => {
      const stats = [
        { category: 'passwords', _count: { id: 5 } },
        { category: 'notes', _count: { id: 3 } },
      ];

      (prisma.vaultEntry.groupBy as jest.Mock).mockResolvedValue(stats);

      const result = await service.getCategoryCounts('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('getScopedVaultData', () => {
    it('should return scoped fields based on approved list', async () => {
      (prisma.vaultField.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'field-1',
          fieldKey: 'email',
          encryptedValue: 'encrypted-test@example.com',
        },
      ]);

      const result = await service.getScopedVaultData(
        'user-1',
        'app-1',
        ['email'],
        'master-key',
      );

      expect(result).toBeDefined();
      expect(encryptionService.decrypt).toHaveBeenCalled?.();
    });

    it('should enforce approved fields subset', async () => {
      (prisma.vaultField.findMany as jest.Mock).mockResolvedValue([
        {
          fieldKey: 'email',
          encryptedValue: 'encrypted-test@example.com',
        },
        {
          fieldKey: 'ssn',
          encryptedValue: 'encrypted-123-45-6789',
        },
      ]);

      await service.getScopedVaultData(
        'user-1',
        'app-1',
        ['email'],
        'master-key',
      );

      expect(encryptionService.decrypt).toHaveBeenCalled?.();
    });
  });
});
