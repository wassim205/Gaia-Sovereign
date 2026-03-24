import { Test } from '@nestjs/testing';
import { EncryptionServiceV2 } from './encryption-service-v2.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionServiceV2', () => {
  let service: EncryptionServiceV2;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EncryptionServiceV2,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => null) },
        },
      ],
    }).compile();

    service = module.get<EncryptionServiceV2>(EncryptionServiceV2);
  });

  describe('encryptWithMetadata', () => {
    it('should encrypt plaintext with metadata', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const payload = service.encryptWithMetadata(plaintext, userId, masterKey);

      expect(payload.ciphertext).toBeDefined();
      expect(payload.metadata).toBeDefined();
      expect(payload.metadata.nonce).toBeDefined();
      expect(payload.metadata.tag).toBeDefined();
      expect(payload.metadata.salt).toBeDefined();
      expect(payload.metadata.keyVersion).toBe(1);
      expect(payload.metadata.algorithm).toBe('aes-256-gcm');
      expect(payload.metadata.encryptedAt).toBeDefined();
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const payload1 = service.encryptWithMetadata(
        plaintext,
        userId,
        masterKey,
      );
      const payload2 = service.encryptWithMetadata(
        plaintext,
        userId,
        masterKey,
      );

      expect(payload1.ciphertext).not.toEqual(payload2.ciphertext);
      expect(payload1.metadata.nonce).not.toEqual(payload2.metadata.nonce);
    });
  });

  describe('decryptWithMetadata', () => {
    it('should decrypt encrypted payload correctly', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const payload = service.encryptWithMetadata(plaintext, userId, masterKey);
      const decrypted = service.decryptWithMetadata(payload, userId, masterKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should fail with wrong master key', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const payload = service.encryptWithMetadata(plaintext, userId, masterKey);

      expect(() =>
        service.decryptWithMetadata(payload, userId, 'wrong-key'),
      ).toThrow();
    });

    it('should fail with wrong userId', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const payload = service.encryptWithMetadata(plaintext, userId, masterKey);

      expect(() =>
        service.decryptWithMetadata(payload, 'user-456', masterKey),
      ).toThrow();
    });
  });

  describe('encryptAndSerialize', () => {
    it('should return JSON string', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const serialized = service.encryptAndSerialize(
        plaintext,
        userId,
        masterKey,
      );

      expect(typeof serialized).toBe('string');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => JSON.parse(serialized)).not.toThrow();
    });
  });

  describe('deserializeAndDecrypt', () => {
    it('should decrypt serialized payload', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const serialized = service.encryptAndSerialize(
        plaintext,
        userId,
        masterKey,
      );
      const decrypted = service.deserializeAndDecrypt(
        serialized,
        userId,
        masterKey,
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should fail with malformed JSON', () => {
      expect(() =>
        service.deserializeAndDecrypt('not-json', 'user-123', 'master-secret'),
      ).toThrow();
    });
  });

  describe('needsReencryption', () => {
    it('should detect old key versions', () => {
      const payload = {
        ciphertext: 'test',
        metadata: {
          nonce: 'test',
          tag: 'test',
          salt: 'test',
          keyVersion: 1,
          algorithm: 'aes-256-gcm',
          encryptedAt: Date.now(),
        },
      };

      expect(service.needsReencryption(payload, 2)).toBe(true);
      expect(service.needsReencryption(payload, 1)).toBe(false);
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from payload', () => {
      const plaintext = 'secret data';
      const userId = 'user-123';
      const masterKey = 'master-secret';

      const payload = service.encryptWithMetadata(plaintext, userId, masterKey);
      const metadata = service.extractMetadata(payload);

      expect(metadata.keyVersion).toBe(1);
      expect(metadata.algorithm).toBe('aes-256-gcm');
      expect(metadata.encryptedAt).toBeDefined();
    });
  });
});
