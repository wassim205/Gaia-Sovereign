import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  /**
   * Generate a random master encryption key for user's vault
   * This key will be used to encrypt/decrypt user's sensitive data
   * @returns Base64 encoded encryption key
   */
  generateMasterKey(): string {
    const key = randomBytes(32); // 256-bit key
    return key.toString('base64');
  }
}
