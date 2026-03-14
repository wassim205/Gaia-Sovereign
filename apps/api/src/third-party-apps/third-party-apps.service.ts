import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateThirdPartyAppDto } from './dto/create-third-party-app.dto';
import { UpdateThirdPartyAppDto } from './dto/update-third-party-app.dto';

type ThirdPartyAppPublic = Prisma.ThirdPartyAppGetPayload<{
  select: {
    id: true;
    ownerId: true;
    name: true;
    description: true;
    clientId: true;
    status: true;
    redirectUris: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

function base64Url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function generateClientId(): string {
  // URL-safe, compact, fixed-ish length
  return `gsa_${base64Url(randomBytes(24))}`;
}

function generateClientSecret(): string {
  // Return once to caller; store only a hash
  return `gss_${base64Url(randomBytes(48))}`;
}

function hashSecret(secret: string): string {
  // Simple deterministic hash; later tasks can upgrade to argon2/bcrypt if desired.
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

@Injectable()
export class ThirdPartyAppsService {
  constructor(private prisma: PrismaService) {}

  async create(
    ownerId: string,
    dto: CreateThirdPartyAppDto,
  ): Promise<{ app: ThirdPartyAppPublic; clientSecret: string }> {
    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const secretHash = hashSecret(clientSecret);

    const app = await this.prisma.thirdPartyApp.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        clientId,
        secretHash,
        redirectUris: dto.redirectUris,
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        clientId: true,
        status: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      app,
      clientSecret,
    };
  }

  async findAll(ownerId: string): Promise<ThirdPartyAppPublic[]> {
    return this.prisma.thirdPartyApp.findMany({
      where: { ownerId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        clientId: true,
        status: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rotateSecret(
    appId: string,
    ownerId: string,
  ): Promise<{ app: ThirdPartyAppPublic; clientSecret: string }> {
    const existingApp = await this.prisma.thirdPartyApp.findFirst({
      where: { id: appId, ownerId },
    });

    if (!existingApp) {
      throw new Error('App not found or access denied');
    }

    const newClientSecret = generateClientSecret();
    const newSecretHash = hashSecret(newClientSecret);

    const updatedApp = await this.prisma.thirdPartyApp.update({
      where: { id: appId },
      data: {
        secretHash: newSecretHash,
        secretRotatedAt: new Date(),
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        clientId: true,
        status: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      app: updatedApp,
      clientSecret: newClientSecret,
    };
  }

  async changeStatus(
    appId: string,
    ownerId: string,
    status: 'ACTIVE' | 'BLOCKED',
  ): Promise<ThirdPartyAppPublic> {
    const existingApp = await this.prisma.thirdPartyApp.findFirst({
      where: { id: appId, ownerId },
    });

    if (!existingApp) {
      throw new Error('App not found or access denied');
    }

    return this.prisma.thirdPartyApp.update({
      where: { id: appId },
      data: { status },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        clientId: true,
        status: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    appId: string,
    ownerId: string,
    dto: UpdateThirdPartyAppDto,
  ): Promise<ThirdPartyAppPublic> {
    const existingApp = await this.prisma.thirdPartyApp.findFirst({
      where: { id: appId, ownerId },
    });

    if (!existingApp) {
      throw new Error('App not found or access denied');
    }

    return this.prisma.thirdPartyApp.update({
      where: { id: appId },
      data: {
        name: dto.name,
        description: dto.description,
        redirectUris: dto.redirectUris,
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        description: true,
        clientId: true,
        status: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
