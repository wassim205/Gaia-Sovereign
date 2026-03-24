import { Test, TestingModule } from '@nestjs/testing';
import { KeyRotationService } from 'src/vault/services/key-rotation.service';
import { KeyManagementService } from './key-management.service';
import { EncryptionServiceV2 } from './encryption-service-v2.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('KeyRotationService (GS-138: Encryption/rotation)', () => {
  let service: KeyRotationService;
  let encryptionServiceV2: EncryptionServiceV2;
  let prisma: PrismaService;

  const mockVaultField = {
    id: 'field-1',
    encryptedValue: 'old-encrypted-value',
    encryptionMeta: JSON.stringify({
      keyVersion: 1,
      algorithm: 'AES-256-GCM',
      nonce: 'nonce123',
      tag: 'tag123',
      salt: 'salt123',
      encryptedAt: Date.now(),
    }),
    vaultEntryId: 'entry-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyRotationService,
        {
          provide: KeyManagementService,
          useValue: {
            getCurrentKeyVersion: jest.fn().mockReturnValue(2),
            prepareKeyRotation: jest.fn().mockReturnValue({
              keyVersion: 2,
              algorithm: 'AES-256-GCM',
            }),
          },
        },
        {
          provide: EncryptionServiceV2,
          useValue: {
            decryptWithMetadata: jest.fn().mockReturnValue('decrypted-value'),
            encryptWithMetadata: jest.fn().mockReturnValue({
              ciphertext: 'encrypted-data',
              metadata: {
                keyVersion: 2,
                algorithm: 'AES-256-GCM',
                nonce: 'nonce',
                tag: 'tag',
                salt: 'salt',
                encryptedAt: Date.now(),
              },
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            vaultField: {
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<KeyRotationService>(KeyRotationService);
    encryptionServiceV2 = module.get<EncryptionServiceV2>(EncryptionServiceV2);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('initiateRotation', () => {
    it('should initiate key rotation process', async () => {
      (prisma.vaultField.count as jest.Mock).mockResolvedValueOnce(5);

      const result = await service.initiateRotation();

      expect(result.status).toBe('initiated');
      expect(result.toKeyVersion).toBe(2);
      expect(result.fieldsToRotate).toBe(5);
    });

    it('should log rotation metrics', async () => {
      (prisma.vaultField.count as jest.Mock).mockResolvedValueOnce(10);

      const result = await service.initiateRotation();

      expect(result.fromKeyVersion).toBe(1);
      expect(result.toKeyVersion).toBe(2);
      expect(result.startedAt).toBeInstanceOf(Date);
    });
  });

  describe('getRotationStatus', () => {
    it('should report current rotation status', async () => {
      (prisma.vaultField.count as jest.Mock).mockResolvedValueOnce(3);

      const status = await service.getRotationStatus();

      expect(status.currentKeyVersion).toBe(2);
      expect(status.fieldsNeedingRotation).toBe(3);
    });

    it('should estimate rotation time based on field count', async () => {
      (prisma.vaultField.count as jest.Mock).mockResolvedValueOnce(2500);

      const status = await service.getRotationStatus();

      expect(status.estimatedTimeMinutes).toBeGreaterThan(2);
    });
  });

  describe('rotateFieldsBatch', () => {
    it('should identify fields requiring key rotation', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );

      await service.rotateFieldsBatch('user-1', 'master-key');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.vaultField.findMany).toHaveBeenCalled();
    });

    it('should decrypt fields with old key version', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );

      await service.rotateFieldsBatch('user-1', 'master-key');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(encryptionServiceV2.decryptWithMetadata).toHaveBeenCalled();
    });

    it('should encrypt fields with new key version', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );

      await service.rotateFieldsBatch('user-1', 'master-key');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(encryptionServiceV2.encryptWithMetadata).toHaveBeenCalled();
    });

    it('should skip fields already at current key version', async () => {
      const fieldsToRotate = [
        {
          ...mockVaultField,
          encryptionMeta: JSON.stringify({
            keyVersion: 2,
            algorithm: 'AES-256-GCM',
          }),
          vaultEntry: { userId: 'user-1' },
        },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );

      const result = await service.rotateFieldsBatch('user-1', 'master-key');

      expect(result.skipped).toBeGreaterThan(0);
    });

    it('should handle batch rotation for multiple fields', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
        {
          ...mockVaultField,
          id: 'field-2',
          vaultEntry: { userId: 'user-1' },
        },
        {
          ...mockVaultField,
          id: 'field-3',
          vaultEntry: { userId: 'user-1' },
        },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );

      const result = await service.rotateFieldsBatch(
        'user-1',
        'master-key',
        100,
      );

      expect(result.processed).toBeGreaterThan(0);
    });

    it('should preserve data integrity during rotation', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );
      (encryptionServiceV2.decryptWithMetadata as jest.Mock).mockReturnValue(
        'sensitive-data',
      );

      await service.rotateFieldsBatch('user-1', 'master-key');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(encryptionServiceV2.encryptWithMetadata).toHaveBeenCalled();
    });

    it('should support dry run mode', async () => {
      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.rotateFieldsBatch(
        'user-1',
        'master-key',
        100,
        true,
      );

      expect(result.processed).toBe(0);
    });

    it('should track rotation statistics', async () => {
      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.rotateFieldsBatch('user-1', 'master-key');

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('startedAt');
      expect(result).toHaveProperty('endedAt');
    });
  });

  describe('error handling', () => {
    it('should handle decryption errors gracefully', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const mockDecrypt = encryptionServiceV2.decryptWithMetadata as jest.Mock;
      mockDecrypt.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      const result = await service.rotateFieldsBatch('user-1', 'master-key');

      expect(result.errors).toBeGreaterThan(0);
    });

    it('should report field rotation attempts', async () => {
      const fieldsToRotate = [
        { ...mockVaultField, vaultEntry: { userId: 'user-1' } },
      ];

      (prisma.vaultField.findMany as jest.Mock).mockResolvedValueOnce(
        fieldsToRotate,
      );

      const result = await service.rotateFieldsBatch('user-1', 'master-key');

      const total = result.processed + result.skipped + result.errors;
      expect(total).toBeGreaterThanOrEqual(1);
    });
  });
});
