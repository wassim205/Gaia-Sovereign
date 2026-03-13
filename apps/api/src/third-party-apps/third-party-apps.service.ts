import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateThirdPartyAppDto } from './dto/create-third-party-app.dto';

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

    // PrismaService extends PrismaClient, but our TS checker sometimes doesn't see newly added delegates.
    // Access via bracket notation and cast to keep runtime behavior while we stay strictly typed on returns.
    const prismaAny = this.prisma as unknown as {
      thirdPartyApp: {
        create: (args: {
          data: {
            ownerId: string;
            name: string;
            description?: string;
            clientId: string;
            secretHash: string;
            redirectUris: string[];
          };
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
        }) => Promise<ThirdPartyAppPublic>;
      };
    };

    const appUnknown: unknown = await prismaAny.thirdPartyApp.create({
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

    const app = appUnknown as ThirdPartyAppPublic;

    return {
      app,
      clientSecret,
    };
  }
}
