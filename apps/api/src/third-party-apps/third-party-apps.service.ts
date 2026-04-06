import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/auth/services/password.service';
import { AuditLogService } from 'src/audit/services/audit-log.service';
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

@Injectable()
export class ThirdPartyAppsService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private auditLogService: AuditLogService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateThirdPartyAppDto,
  ): Promise<{ app: ThirdPartyAppPublic; clientSecret: string }> {
    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const secretHash = await this.passwordService.hashPassword(clientSecret);

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

    // GS-67: Log app registration
    await this.auditLogService.createAuditLog({
      userId: ownerId,
      action: 'APP_REGISTER',
      resourceType: 'THIRD_PARTY_APP',
      resourceId: app.id,
      details: `App registered: ${app.name}`,
      status: 'success',
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
      throw new NotFoundException('App not found or access denied');
    }

    const newClientSecret = generateClientSecret();
    const newSecretHash =
      await this.passwordService.hashPassword(newClientSecret);

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

    // GS-75: Log secret rotation
    await this.auditLogService.createAuditLog({
      userId: ownerId,
      action: 'SECRET_ROTATE',
      resourceType: 'THIRD_PARTY_APP',
      resourceId: appId,
      details: `Secret rotated for app: ${updatedApp.name}`,
      status: 'success',
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
      throw new NotFoundException('App not found or access denied');
    }

    if (existingApp.ownerId !== ownerId) {
      throw new ForbiddenException('App not found or access denied');
    }

    const updatedApp = await this.prisma.thirdPartyApp.update({
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

    // GS-75: Log status change
    await this.auditLogService.createAuditLog({
      userId: ownerId,
      action: 'APP_STATUS_CHANGE',
      resourceType: 'THIRD_PARTY_APP',
      resourceId: appId,
      details: `App status changed to ${status}`,
      status: 'success',
    });

    return updatedApp;
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
      throw new NotFoundException('App not found or access denied');
    }

    if (existingApp.ownerId !== ownerId) {
      throw new ForbiddenException('App not found or access denied');
    }

    const updatedApp = await this.prisma.thirdPartyApp.update({
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

    // GS-75: Log app configuration edit
    await this.auditLogService.createAuditLog({
      userId: ownerId,
      action: 'APP_EDIT',
      resourceType: 'THIRD_PARTY_APP',
      resourceId: appId,
      details: `App details updated: ${updatedApp.name}`,
      status: 'success',
    });

    return updatedApp;
  }

  async getAllApps() {
    const apps = await this.prisma.thirdPartyApp.findMany();
    return apps;
  }
}
