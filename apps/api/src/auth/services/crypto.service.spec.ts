import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  describe('generateMasterKey', () => {
    it('should generate a master key', () => {
      const key = service.generateMasterKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should generate base64 encoded key', () => {
      const key = service.generateMasterKey();
      expect(key).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should generate 256-bit key (44 base64 chars)', () => {
      const key = service.generateMasterKey();
      // 32 bytes = 256 bits, base64 encoded = 44 chars
      expect(key.length).toBe(44);
    });

    it('should generate unique keys', () => {
      const key1 = service.generateMasterKey();
      const key2 = service.generateMasterKey();
      const key3 = service.generateMasterKey();

      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);
    });

    it('should generate cryptographically random keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(service.generateMasterKey());
      }
      // All 100 keys should be unique
      expect(keys.size).toBe(100);
    });

    it('should be decodable from base64', () => {
      const key = service.generateMasterKey();
      const buffer = Buffer.from(key, 'base64');
      expect(buffer.length).toBe(32);
    });
  });
});
