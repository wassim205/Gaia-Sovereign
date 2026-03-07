import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32;

  /**
   * Derive encryption key from user's master key
   */
  private deriveKey(masterKey: string, salt: Buffer): Buffer {
    return scryptSync(masterKey, salt, this.keyLength);
  }

  /**
   * Encrypt a value using AES-256-GCM
   * @param plaintext - The value to encrypt
   * @param masterKey - User's master encryption key
   * @returns Encrypted value in format: salt:iv:authTag:ciphertext (all base64)
   */
  encrypt(plaintext: string, masterKey: string): string {
    try {
      // Generate random salt and IV
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);

      // Derive key from master key
      const key = this.deriveKey(masterKey, salt);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, key, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Return format: salt:iv:authTag:ciphertext
      return [
        salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted,
      ].join(':');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  /**
   * Decrypt a value using AES-256-GCM
   * @param encryptedData - Encrypted value in format: salt:iv:authTag:ciphertext
   * @param masterKey - User's master encryption key
   * @returns Decrypted plaintext value
   */
  decrypt(encryptedData: string, masterKey: string): string {
    try {
      // Parse encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }

      const [saltB64, ivB64, authTagB64, ciphertext] = parts;

      // Convert from base64
      const salt = Buffer.from(saltB64, 'base64');
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');

      // Derive key from master key
      const key = this.deriveKey(masterKey, salt);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Decryption failed: ${message}`);
    }
  }

  /**
   * Encrypt multiple fields
   */
  encryptFields(
    fields: Record<string, any>,
    masterKey: string,
  ): Record<string, string> {
    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined) {
        const stringValue =
          typeof value === 'string' ? value : JSON.stringify(value);
        encrypted[key] = this.encrypt(stringValue, masterKey);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt multiple fields
   */
  decryptFields(
    encryptedFields: Record<string, string>,
    masterKey: string,
  ): Record<string, string> {
    const decrypted: Record<string, string> = {};

    for (const [key, encryptedValue] of Object.entries(encryptedFields)) {
      if (encryptedValue) {
        decrypted[key] = this.decrypt(encryptedValue, masterKey);
      }
    }

    return decrypted;
  }
}
