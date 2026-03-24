import { Test } from '@nestjs/testing';
import { KeyManagementService } from './key-management.service';
import { ConfigService } from '@nestjs/config';

describe('KeyManagementService', () => {
  let service: KeyManagementService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        KeyManagementService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => null) },
        },
      ],
    }).compile();

    service = module.get<KeyManagementService>(KeyManagementService);
  });

  describe('deriveKeyForUser', () => {
    it('should derive key from userId and masterKey', () => {
      const userId = 'user-123';
      const masterKey = 'secret-key';
      const key = service.deriveKeyForUser(userId, masterKey);

      expect(key).toBeDefined();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should generate same key for same inputs', () => {
      const userId = 'user-123';
      const masterKey = 'secret-key';

      const key1 = service.deriveKeyForUser(userId, masterKey);
      const key2 = service.deriveKeyForUser(userId, masterKey);

      expect(key1).toEqual(key2);
    });

    it('should generate different keys for different userIds', () => {
      const masterKey = 'secret-key';
      const key1 = service.deriveKeyForUser('user-1', masterKey);
      const key2 = service.deriveKeyForUser('user-2', masterKey);

      expect(key1).not.toEqual(key2);
    });

    it('should generate different keys for different keyVersions', () => {
      const userId = 'user-123';
      const masterKey = 'secret-key';

      const key1 = service.deriveKeyForUser(userId, masterKey, 1);
      const key2 = service.deriveKeyForUser(userId, masterKey, 2);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('getCurrentKeyVersion', () => {
    it('should return current key version', () => {
      const version = service.getCurrentKeyVersion();
      expect(version).toBe(1);
    });
  });

  describe('incrementKeyVersion', () => {
    it('should increment key version', () => {
      const v1 = service.getCurrentKeyVersion();
      service.incrementKeyVersion();
      const v2 = service.getCurrentKeyVersion();

      expect(v2).toBe(v1 + 1);
    });
  });

  describe('getKeyMetadata', () => {
    it('should return metadata for key version', () => {
      const meta = service.getKeyMetadata(1);

      expect(meta.keyVersion).toBe(1);
      expect(meta.algorithm).toBe('aes-256-gcm');
      expect(meta.derivationMethod).toBe('scrypt');
      expect(meta.createdAt).toBeDefined();
    });
  });

  describe('exportMasterSalt', () => {
    it('should export master salt as base64', () => {
      const salt = service.exportMasterSalt();

      expect(typeof salt).toBe('string');
      expect(() => Buffer.from(salt, 'base64')).not.toThrow();
    });
  });
});
