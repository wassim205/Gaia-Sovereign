import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes, scryptSync } from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * GS-132/133: Key Management Service
 * Handles per-user derived keys and KMS abstraction for enterprise key storage.
 */

export interface KeyMetadata {
  keyVersion: number;
  algorithm: string;
  derivationMethod: 'scrypt' | 'kms';
  kmsKeyId?: string;
  createdAt: number;
}

export interface EncryptionMetadata {
  nonce: string;
  tag: string;
  salt: string;
  keyVersion: number;
  algorithm: string;
  encryptedAt: number;
}

@Injectable()
export class KeyManagementService {
  private readonly logger = new Logger(KeyManagementService.name);
  private readonly keyLength = 32;
  private readonly saltLength = 32;
  private currentKeyVersion = 1;
  private masterSalt: Buffer;

  constructor(private configService: ConfigService) {
    const masterSaltEnv = this.configService.get<string>(
      'ENCRYPTION_MASTER_SALT',
    );
    this.masterSalt = masterSaltEnv
      ? Buffer.from(masterSaltEnv, 'base64')
      : randomBytes(this.saltLength);
    this.logger.log(
      `KeyManagementService initialized with key version: ${this.currentKeyVersion}`,
    );
  }

  deriveKeyForUser(
    userId: string,
    masterKey: string,
    keyVersion: number = this.currentKeyVersion,
  ): Buffer {
    const hmac = createHmac('sha256', this.masterSalt);
    hmac.update(`${userId}:${keyVersion}`);
    const userSalt = hmac.digest();
    return scryptSync(masterKey, userSalt, this.keyLength);
  }

  deriveKeyForField(
    userId: string,
    fieldKey: string,
    masterKey: string,
    keyVersion: number = this.currentKeyVersion,
  ): Buffer {
    const hmac = createHmac('sha256', this.masterSalt);
    hmac.update(`${userId}:${fieldKey}:${keyVersion}`);
    const fieldSalt = hmac.digest();
    return scryptSync(masterKey, fieldSalt, this.keyLength);
  }

  getCurrentKeyVersion(): number {
    return this.currentKeyVersion;
  }

  incrementKeyVersion(): number {
    this.currentKeyVersion += 1;
    this.logger.warn(`Key version incremented to ${this.currentKeyVersion}`);
    return this.currentKeyVersion;
  }

  getKeyMetadata(keyVersion: number): KeyMetadata {
    return {
      keyVersion,
      algorithm: 'aes-256-gcm',
      derivationMethod: 'scrypt',
      createdAt: Date.now(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getKeyFromKms(_kmsKeyId: string): Promise<Buffer> {
    return Promise.reject(new Error('KMS integration not yet implemented'));
  }

  prepareKeyRotation(oldKeyVersion: number): KeyMetadata {
    const newVersion = this.incrementKeyVersion();
    this.logger.log(`Key rotation prepared: ${oldKeyVersion} -> ${newVersion}`);
    return this.getKeyMetadata(newVersion);
  }

  exportMasterSalt(): string {
    return this.masterSalt.toString('base64');
  }
}
