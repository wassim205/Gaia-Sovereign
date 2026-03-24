import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/auth/services/password.service';
import { TokenService } from 'src/tokens/token.service';
import { AuditLogService } from 'src/audit/services/audit-log.service';
import { CreateConsentRequestDto } from './dto/create-consent-request.dto';
import { ApproveConsentRequestDto } from './dto/approve-consent-request.dto';

const DEFAULT_CONSENT_TTL_MINUTES = 10;

type ConsentRequestPayload = Prisma.ConsentRequestGetPayload<{
  select: {
    id: true;
    appId: true;
    redirectUri: true;
    requestedFields: true;
    expiresAt: true;
    status: true;
    state: true;
    createdAt: true;
  };
}>;

type ConsentAppPayload = Prisma.ThirdPartyAppGetPayload<{
  select: {
    id: true;
    name: true;
    clientId: true;
    secretHash: true;
    redirectUris: true;
  };
}>;

@Injectable()
export class ConsentService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private auditLogService: AuditLogService,
  ) {}

  private normalizeFields(fields: string[]): string[] {
    const normalized = fields
      .map((field) => field.trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(normalized)).sort();
  }

  async createConsentRequest(dto: CreateConsentRequestDto): Promise<{
    consentRequest: ConsentRequestPayload;
    app: ConsentAppPayload;
  }> {
    const prisma = this.prisma as PrismaClient;
    const app = await this.prisma.thirdPartyApp.findFirst({
      where: { clientId: dto.clientId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        clientId: true,
        secretHash: true,
        redirectUris: true,
      },
    });

    if (!app) {
      throw new NotFoundException('App not found or inactive');
    }

    const isSecretValid = await this.passwordService.verifyPassword(
      app.secretHash,
      dto.clientSecret,
    );

    if (!isSecretValid) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    if (!app.redirectUris.includes(dto.redirectUri)) {
      throw new BadRequestException('Redirect URI is not registered');
    }

    const requestedFields = this.normalizeFields(dto.requestedFields);

    if (requestedFields.length === 0) {
      throw new BadRequestException('At least one field must be requested');
    }

    const ttlMinutes = parseInt(
      process.env.CONSENT_REQUEST_TTL_MINUTES ||
        DEFAULT_CONSENT_TTL_MINUTES.toString(),
      10,
    );
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const consentRequest: ConsentRequestPayload =
      await prisma.consentRequest.create({
        data: {
          appId: app.id,
          redirectUri: dto.redirectUri,
          requestedFields,
          expiresAt,
          status: 'PENDING',
          state: dto.state || null,
        },
        select: {
          id: true,
          appId: true,
          redirectUri: true,
          requestedFields: true,
          expiresAt: true,
          status: true,
          state: true,
          createdAt: true,
        },
      });

    return {
      consentRequest,
      app,
    };
  }

  async getConsentDetail(consentId: string, userId: string) {
    const consentRequest = await this.prisma.consentRequest.findUnique({
      where: { id: consentId },
      select: {
        id: true,
        appId: true,
        redirectUri: true,
        requestedFields: true,
        status: true,
        expiresAt: true,
        state: true,
        createdAt: true,
        app: {
          select: {
            id: true,
            name: true,
            description: true,
            ownerId: true,
          },
        },
      },
    });

    if (!consentRequest) {
      throw new NotFoundException('Consent request not found');
    }

    // Check if the request has expired
    if (new Date() > consentRequest.expiresAt) {
      await this.prisma.consentRequest.update({
        where: { id: consentId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Consent request has expired');
    }

    // User must be the owner of the app to see the consent request
    if (consentRequest.app.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this consent request',
      );
    }

    return consentRequest;
  }

  async approveConsent(
    consentId: string,
    userId: string,
    dto: ApproveConsentRequestDto,
  ) {
    const consentRequest = await this.prisma.consentRequest.findUnique({
      where: { id: consentId },
      select: {
        id: true,
        status: true,
        requestedFields: true,
        app: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!consentRequest) {
      throw new NotFoundException('Consent request not found');
    }

    if (consentRequest.app.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to approve this consent request',
      );
    }

    if (consentRequest.status !== 'PENDING') {
      throw new BadRequestException(
        'Consent request has already been processed',
      );
    }

    // Normalize approved fields
    const normalizedApprovedFields = this.normalizeFields(
      dto.approvedFields || consentRequest.requestedFields,
    );

    // Validate that all approved fields are in the requested fields
    const normalizedRequestedFields = this.normalizeFields(
      consentRequest.requestedFields,
    );
    const invalidFields = normalizedApprovedFields.filter(
      (field) => !normalizedRequestedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Invalid fields requested: ${invalidFields.join(', ')}. Only requested fields can be approved: ${normalizedRequestedFields.join(', ')}`,
      );
    }

    // Ensure at least one field is approved
    if (normalizedApprovedFields.length === 0) {
      throw new BadRequestException('At least one field must be approved');
    }

    const updated = await this.prisma.consentRequest.update({
      where: { id: consentId },
      data: {
        status: 'APPROVED',
        requestedFields: normalizedApprovedFields,
      },
      select: {
        id: true,
        status: true,
        requestedFields: true,
        redirectUri: true,
        state: true,
        appId: true,
      },
    });

    // Generate access token for the approved consent
    const tokenResult = await this.tokenService.generateAccessToken({
      userId,
      appId: updated.appId,
      approvedFields: normalizedApprovedFields,
    });

    // Log consent approval action (GS-121)
    await this.auditLogService.createAuditLog({
      userId,
      action: 'CONSENT_APPROVE',
      resourceType: 'CONSENT_REQUEST',
      resourceId: updated.id,
      appId: updated.appId,
      approvedFields: normalizedApprovedFields,
      requestedFields: normalizedRequestedFields,
      status: 'success',
    });

    return {
      id: updated.id,
      status: updated.status,
      requestedFields: updated.requestedFields,
      redirectUri: updated.redirectUri,
      state: updated.state,
      accessToken: tokenResult.token,
      tokenExpiresAt: tokenResult.expiresAt,
    };
  }

  async denyConsent(consentId: string, userId: string) {
    const consentRequest = await this.prisma.consentRequest.findUnique({
      where: { id: consentId },
      select: {
        id: true,
        status: true,
        app: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!consentRequest) {
      throw new NotFoundException('Consent request not found');
    }

    if (consentRequest.app.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to deny this consent request',
      );
    }

    if (consentRequest.status !== 'PENDING') {
      throw new BadRequestException(
        'Consent request has already been processed',
      );
    }

    const updated = await this.prisma.consentRequest.update({
      where: { id: consentId },
      data: { status: 'REJECTED' },
      select: {
        id: true,
        status: true,
        redirectUri: true,
        state: true,
      },
    });

    // Log consent denial action (GS-121)
    const consentData = await this.prisma.consentRequest.findUnique({
      where: { id: consentId },
      select: {
        appId: true,
        requestedFields: true,
      },
    });

    await this.auditLogService.createAuditLog({
      userId,
      action: 'CONSENT_DENY',
      resourceType: 'CONSENT_REQUEST',
      resourceId: consentId,
      appId: consentData?.appId,
      requestedFields: consentData?.requestedFields || [],
      status: 'success',
    });

    return updated;
  }
}
