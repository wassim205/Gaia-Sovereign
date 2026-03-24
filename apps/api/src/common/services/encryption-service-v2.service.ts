import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import {
  KeyManagementService,
  EncryptionMetadata,
} from './key-management.service';

export interface EncryptedPayload {
  ciphertext: string;
  metadata: EncryptionMetadata;
}

@Injectable()
export class EncryptionServiceV2 {
  private readonly logger = new Logger(EncryptionServiceV2.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 32;

  constructor(private keyManagementService: KeyManagementService) {}

  encryptWithMetadata(
    plaintext: string,
    userId: string,
    masterKey: string,
  ): EncryptedPayload {
    try {
      const nonce = randomBytes(this.ivLength);
      const salt = randomBytes(this.saltLength);
      const keyVersion = this.keyManagementService.getCurrentKeyVersion();
      const key = this.keyManagementService.deriveKeyForUser(
        userId,
        masterKey,
        keyVersion,
      );

      const cipher = createCipheriv(this.algorithm, key, nonce);
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag();

      const metadata: EncryptionMetadata = {
        nonce: nonce.toString('base64'),
        tag: authTag.toString('base64'),
        salt: salt.toString('base64'),
        keyVersion,
        algorithm: this.algorithm,
        encryptedAt: Date.now(),
      };

      return {
        ciphertext: encrypted,
        metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Encryption failed for user ${userId}: ${message}`);
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  decryptWithMetadata(
    payload: EncryptedPayload,
    userId: string,
    masterKey: string,
  ): string {
    try {
      const { ciphertext, metadata } = payload;
      const nonce = Buffer.from(metadata.nonce, 'base64');
      const authTag = Buffer.from(metadata.tag, 'base64');
      const key = this.keyManagementService.deriveKeyForUser(
        userId,
        masterKey,
        metadata.keyVersion,
      );

      const decipher = createDecipheriv(this.algorithm, key, nonce);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Decryption failed for user ${userId}: ${message}`);
      throw new Error(`Decryption failed: ${message}`);
    }
  }

  encryptAndSerialize(
    plaintext: string,
    userId: string,
    masterKey: string,
  ): string {
    const payload = this.encryptWithMetadata(plaintext, userId, masterKey);
    return JSON.stringify(payload);
  }

  deserializeAndDecrypt(
    serializedPayload: string,
    userId: string,
    masterKey: string,
  ): string {
    try {
      const payload = JSON.parse(serializedPayload) as EncryptedPayload;
      return this.decryptWithMetadata(payload, userId, masterKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Deserialization/decryption failed: ${message}`);
      throw new Error(`Failed to deserialize and decrypt: ${message}`);
    }
  }

  encryptFieldsWithMetadata(
    fields: Record<string, string>,
    userId: string,
    masterKey: string,
  ): Record<string, EncryptedPayload> {
    const encrypted: Record<string, EncryptedPayload> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined) {
        encrypted[key] = this.encryptWithMetadata(value, userId, masterKey);
      }
    }
    return encrypted;
  }

  decryptFieldsWithMetadata(
    encryptedFields: Record<string, EncryptedPayload>,
    userId: string,
    masterKey: string,
  ): Record<string, string> {
    const decrypted: Record<string, string> = {};
    for (const [key, payload] of Object.entries(encryptedFields)) {
      if (payload) {
        decrypted[key] = this.decryptWithMetadata(payload, userId, masterKey);
      }
    }
    return decrypted;
  }

  extractMetadata(payload: EncryptedPayload): EncryptionMetadata {
    return payload.metadata;
  }

  needsReencryption(
    payload: EncryptedPayload,
    currentKeyVersion: number,
  ): boolean {
    return payload.metadata.keyVersion < currentKeyVersion;
  }
}
