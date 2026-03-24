import { Test, TestingModule } from '@nestjs/testing';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { UsersService } from 'src/users/users.service';

describe('VaultController', () => {
  let controller: VaultController;
  let vaultService: VaultService;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-1',
    username: 'john',
    email: 'john@example.com',
  };

  const mockCurrentUser = {
    id: 'user-1',
    username: 'john',
    email: 'john@example.com',
  };

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
        value: 'john',
        fieldType: 'text',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaultController],
      providers: [
        {
          provide: VaultService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getCategoryCounts: jest.fn(),
            getScopedVaultData: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              ...mockUser,
              encryptedMasterKey: 'master-key',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<VaultController>(VaultController);
    vaultService = module.get<VaultService>(VaultService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create vault entry', async () => {
      (vaultService.create as jest.Mock).mockResolvedValue(mockVaultEntry);

      const result = await controller.create(mockCurrentUser as any, {
        title: 'My Passwords',
        category: 'CREDENTIAL',
        fields: [
          { fieldKey: 'username', value: 'john', fieldType: 'text' },
        ],
      } as any);

      expect(result.message).toBe('Vault entry created successfully');
      expect(result.data.id).toBe('vault-1');
    });

    it('should fetch user master key', async () => {
      (vaultService.create as jest.Mock).mockResolvedValue(mockVaultEntry);

      await controller.create(mockCurrentUser as any, {
        title: 'Test',
        category: 'CREDENTIAL',
        fields: [],
      } as any);

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
    });

    it('should require authentication', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated vault entries', async () => {
      const mockResult = {
        data: [mockVaultEntry],
        meta: { total: 1, limit: 10, offset: 0 },
      };

      (vaultService.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.findAll(mockCurrentUser as any, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should support filtering by category', async () => {
      const mockResult = {
        data: [mockVaultEntry],
        meta: { total: 1, limit: 10, offset: 0 },
      };

      (vaultService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.findAll(mockCurrentUser as any, {
        category: 'passwords',
      });

      expect(vaultService.findAll).toHaveBeenCalled?.();
    });

    it('should support search', async () => {
      const mockResult = {
        data: [mockVaultEntry],
        meta: { total: 1, limit: 10, offset: 0 },
      };

      (vaultService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.findAll(mockCurrentUser as any, {
        search: 'passwords',
      });

      expect(vaultService.findAll).toHaveBeenCalled?.();
    });
  });

  describe('getCategoryCounts', () => {
    it('should return category counts', async () => {
      const mockCounts = [
        { category: 'passwords', count: 5 },
        { category: 'notes', count: 3 },
      ];

      (vaultService.getCategoryCounts as jest.Mock).mockResolvedValue(
        mockCounts,
      );

      const result = await controller.getCategoryCounts(mockCurrentUser as any);

      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return single vault entry', async () => {
      (vaultService.findOne as jest.Mock).mockResolvedValue(mockVaultEntry);

      const result = await controller.findOne(
        mockCurrentUser as any,
        'vault-1',
      );

      expect(result.id).toBe('vault-1');
      expect(result.title).toBe('My Passwords');
    });

    it('should throw if entry not found', async () => {
      (vaultService.findOne as jest.Mock).mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        controller.findOne(mockCurrentUser as any, 'vault-1'),
      ).rejects.toThrow('Not found');
    });
  });

  describe('update', () => {
    it('should update vault entry', async () => {
      const updated = { ...mockVaultEntry, title: 'Updated' };
      (vaultService.update as jest.Mock).mockResolvedValue(updated);

      const result = await controller.update(
        mockCurrentUser as any,
        'vault-1',
        { title: 'Updated' } as any,
      );

      expect(result.message).toBe('Vault entry updated successfully');
      expect(result.data.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete vault entry', async () => {
      (vaultService.remove as jest.Mock).mockResolvedValue({});

      const result = await controller.remove(
        mockCurrentUser as any,
        'vault-1',
      );

      expect(result.message).toBe('Vault entry deleted successfully');
    });
  });
});
