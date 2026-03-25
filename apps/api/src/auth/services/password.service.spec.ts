import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecurePassword123';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'mySecurePassword123';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await service.hashPassword('');
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await service.hashPassword(longPassword);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'mySecurePassword123';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(hash, password);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'mySecurePassword123';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(hash, 'wrongPassword');

      expect(isValid).toBe(false);
    });

    it('should reject empty password when hash is not empty', async () => {
      const password = 'mySecurePassword123';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(hash, '');

      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const isValid = await service.verifyPassword('invalid-hash', 'password');
      expect(isValid).toBe(false);
    });

    it('should handle malformed hash', async () => {
      const isValid = await service.verifyPassword(
        '$argon2id$malformed',
        'password',
      );
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'MyPassword';
      const hash = await service.hashPassword(password);
      const isValid = await service.verifyPassword(hash, 'mypassword');

      expect(isValid).toBe(false);
    });
  });
});
