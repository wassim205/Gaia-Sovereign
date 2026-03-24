import { Test, TestingModule } from '@nestjs/testing';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { UsersService } from 'src/users/users.service';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

describe('VaultController - Scoped Access', () => {
  let controller: VaultController;
  let vaultService: VaultService;
  let usersService: UsersService;

  const mockUser: CurrentUserData = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'testuser',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaultController],
      providers: [
        {
          provide: VaultService,
          useValue: {
            getScopedVaultData: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VaultController>(VaultController);
    vaultService = module.get<VaultService>(VaultService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('getScopedData (GS-117: Scope reading, GS-97: Subset validation)', () => {
    it('should return only approved fields', async () => {
      const approvedFields = ['email', 'name'];
      const scopedData = {
        userId: mockUser.id,
        approvedFields,
        returnedFields: approvedFields,
        data: [
          { fieldKey: 'email', value: 'test@example.com' },
          { fieldKey: 'name', value: 'John Doe' },
        ],
      };

      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      (vaultService.getScopedVaultData as jest.Mock).mockResolvedValueOnce(
        scopedData,
      );

      const result = await controller.getScopedData(mockUser, {
        requestedFields: ['email', 'name'],
      });

      expect(result.message).toBe('Scoped vault data retrieved successfully');
      expect(result.data.approvedFields).toEqual(approvedFields);
      expect(result.data.data).toHaveLength(2);
    });

    it('should enforce approved fields subset constraint', async () => {
      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      (vaultService.getScopedVaultData as jest.Mock).mockRejectedValueOnce(
        new Error('Requested fields not approved'),
      );

      await expect(
        controller.getScopedData(mockUser, {
          requestedFields: ['email', 'ssn'],
        }),
      ).rejects.toThrow();
    });

    it('should handle empty approved fields gracefully', async () => {
      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      (vaultService.getScopedVaultData as jest.Mock).mockResolvedValueOnce({
        userId: mockUser.id,
        approvedFields: [],
        returnedFields: [],
        data: [],
      });

      const result = await controller.getScopedData(mockUser, {});

      expect(result.data.returnedFields).toEqual([]);
      expect(result.data.data).toEqual([]);
    });

    it('should filter to intersection of approved and requested fields', async () => {
      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      const approvedFields = ['email', 'name', 'phone'];
      const requestedFields = ['email', 'phone', 'address'];

      (vaultService.getScopedVaultData as jest.Mock).mockResolvedValueOnce({
        userId: mockUser.id,
        approvedFields,
        returnedFields: ['email', 'phone'],
        data: [
          { fieldKey: 'email', value: 'test@example.com' },
          { fieldKey: 'phone', value: '555-1234' },
        ],
      });

      const result = await controller.getScopedData(mockUser, {
        requestedFields,
      });

      expect(result.data.returnedFields).toEqual(['email', 'phone']);
      expect(result.data.data).toHaveLength(2);
    });

    it('should return all approved fields when no specific fields requested', async () => {
      const approvedFields = ['email', 'name', 'phone'];

      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      (vaultService.getScopedVaultData as jest.Mock).mockResolvedValueOnce({
        userId: mockUser.id,
        approvedFields,
        returnedFields: approvedFields,
        data: [
          { fieldKey: 'email', value: 'test@example.com' },
          { fieldKey: 'name', value: 'John Doe' },
          { fieldKey: 'phone', value: '555-1234' },
        ],
      });

      const result = await controller.getScopedData(mockUser, {});

      expect(result.data.returnedFields).toEqual(approvedFields);
      expect(result.data.data).toHaveLength(3);
    });

    it('should decrypt vault fields before returning', async () => {
      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      (vaultService.getScopedVaultData as jest.Mock).mockResolvedValueOnce({
        userId: mockUser.id,
        approvedFields: ['email'],
        returnedFields: ['email'],
        data: [
          {
            fieldKey: 'email',
            value: 'decrypted@example.com',
            fieldType: 'text',
          },
        ],
      });

      const result = await controller.getScopedData(mockUser, {
        requestedFields: ['email'],
      });

      expect(result.data.data[0].value).toBe('decrypted@example.com');
    });

    it('should track accessed fields in audit log', async () => {
      (usersService.findById as jest.Mock).mockResolvedValueOnce({
        encryptedMasterKey: 'master-key',
      });

      (vaultService.getScopedVaultData as jest.Mock).mockResolvedValueOnce({
        userId: mockUser.id,
        approvedFields: ['email', 'name'],
        returnedFields: ['email', 'name'],
        data: [
          { fieldKey: 'email', value: 'test@example.com' },
          { fieldKey: 'name', value: 'John Doe' },
        ],
      });

      await controller.getScopedData(mockUser, {
        requestedFields: ['email', 'name'],
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vaultService.getScopedVaultData).toHaveBeenCalledWith(
        mockUser.id,
        'master-key',
        ['email', 'username', 'phone', 'profile'],
        ['email', 'name'],
      );
    });
  });
});
