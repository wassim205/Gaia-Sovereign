import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string; // user ID
  app_id: string;
  approved_fields: string[];
  iat: number;
  exp: number;
}

interface GenerateTokenOptions {
  userId: string;
  appId: string;
  approvedFields: string[];
  ttlMinutes?: number;
}

const DEFAULT_ACCESS_TOKEN_TTL_MINUTES = 60; // 1 hour

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate an access token for a user to access an app's data
   * Returns both the token (opaque) and stores the hash in database
   */
  async generateAccessToken(
    options: GenerateTokenOptions,
  ): Promise<{ token: string; expiresAt: Date }> {
    const ttlMinutes = options.ttlMinutes || DEFAULT_ACCESS_TOKEN_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const payload: AccessTokenPayload = {
      sub: options.userId,
      app_id: options.appId,
      approved_fields: options.approvedFields,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // Sign the JWT token
    const token = this.jwtService.sign(payload);

    // Create hash of token for storage (opaque token approach)
    const tokenHash = this.hashToken(token);

    // Store token hash in database for lookup/revocation
    await this.prisma.accessToken.create({
      data: {
        tokenHash,
        appId: options.appId,
        userId: options.userId,
        approvedFields: options.approvedFields,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  /**
   * Verify an access token and return its payload
   * Checks: signature, expiry, database presence, revocation status
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    let payload: AccessTokenPayload;

    // Step 1: Verify JWT signature and structure
    try {
      payload = this.jwtService.verify<AccessTokenPayload>(token);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('jwt expired')) {
        throw new Error('Token has expired');
      }
      if (message.includes('invalid signature')) {
        throw new Error('Invalid token signature');
      }
      if (message.includes('invalid token')) {
        throw new Error('Invalid token format');
      }
      throw new Error(`Token signature verification failed: ${message}`);
    }

    // Step 2: Check token exists in database
    const tokenHash = this.hashToken(token);
    const storedToken = await this.prisma.accessToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new Error(
        'Token not found - may have been revoked or never issued',
      );
    }

    // Step 3: Check if token has been revoked
    if (storedToken.revokedAt) {
      throw new Error('Token has been revoked');
    }

    // Step 4: Verify expiry against database (redundant with JWT but adds security)
    if (storedToken.expiresAt < new Date()) {
      throw new Error('Token has expired');
    }

    return payload;
  }

  /**
   * Validate token for Vault API access
   * Returns approved fields/scopes the token has access to
   */
  async validateVaultToken(
    token: string,
  ): Promise<{ userId: string; appId: string; approvedFields: string[] }> {
    const payload = await this.verifyAccessToken(token);
    const tokenHash = this.hashToken(token);

    const storedToken = await this.prisma.accessToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        appId: true,
        approvedFields: true,
      },
    });

    if (!storedToken) {
      throw new Error('Token metadata not found');
    }

    return {
      userId: storedToken.userId,
      appId: storedToken.appId,
      approvedFields: storedToken.approvedFields,
    };
  }

  /**
   * Revoke an access token
   */
  async revokeAccessToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.prisma.accessToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get token info by token hash
   */
  async getTokenInfo(token: string) {
    const tokenHash = this.hashToken(token);
    return this.prisma.accessToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        appId: true,
        userId: true,
        approvedFields: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Create a hash of a token for secure storage (opaque token approach)
   * This way we never store the actual token, only its hash
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
