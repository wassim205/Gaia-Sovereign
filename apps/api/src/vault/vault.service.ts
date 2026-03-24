import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/encryption.service';
import { AuditLogService } from 'src/audit/services/audit-log.service';
import { CreateVaultEntryDto } from './dto/create-vault-entry.dto';
import { UpdateVaultEntryDto } from './dto/update-vault-entry.dto';
import { QueryVaultEntriesDto } from './dto/query-vault-entries.dto';

@Injectable()
export class VaultService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private auditLogService: AuditLogService,
  ) {}

  async create(userId: string, masterKey: string, dto: CreateVaultEntryDto) {
    // Create vault entry with encrypted fields
    const vaultEntry = await this.prisma.vaultEntry.create({
      data: {
        userId,
        title: dto.title,
        category: dto.category,
        description: dto.description,
        isFavorite: dto.isFavorite ?? false,
        fields: {
          create: dto.fields.map((field) => ({
            fieldKey: field.fieldKey,
            encryptedValue: this.encryptionService.encrypt(
              field.value,
              masterKey,
            ),
            fieldType: field.fieldType || 'text',
          })),
        },
      },
      include: {
        fields: true,
      },
    });

    // Decrypt fields for response
    return this.decryptVaultEntry(vaultEntry, masterKey);
  }

  async findAll(
    userId: string,
    masterKey: string,
    query: QueryVaultEntriesDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.vaultEntry.count({ where });

    // Get entries
    const entries = await this.prisma.vaultEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        fields: true,
      },
    });

    // Decrypt all entries
    const decryptedEntries = entries.map((entry) =>
      this.decryptVaultEntry(entry, masterKey),
    );

    return {
      data: decryptedEntries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, masterKey: string, id: string) {
    const entry = await this.prisma.vaultEntry.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!entry) {
      throw new NotFoundException('Vault entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not own this vault entry');
    }

    return this.decryptVaultEntry(entry, masterKey);
  }

  async update(
    userId: string,
    masterKey: string,
    id: string,
    dto: UpdateVaultEntryDto,
  ) {
    // Check ownership
    await this.findOne(userId, masterKey, id);

    // Update entry
    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isFavorite !== undefined) updateData.isFavorite = dto.isFavorite;

    // If fields are provided, replace them
    if (dto.fields) {
      // Delete existing fields
      await this.prisma.vaultField.deleteMany({
        where: { vaultEntryId: id },
      });

      // Create new fields
      updateData.fields = {
        create: dto.fields.map((field) => ({
          fieldKey: field.fieldKey,
          encryptedValue: this.encryptionService.encrypt(
            field.value,
            masterKey,
          ),
          fieldType: field.fieldType || 'text',
        })),
      };
    }

    const updated = await this.prisma.vaultEntry.update({
      where: { id },
      data: updateData,
      include: { fields: true },
    });

    return this.decryptVaultEntry(updated, masterKey);
  }

  async remove(userId: string, id: string) {
    // Check ownership
    const entry = await this.prisma.vaultEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Vault entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not own this vault entry');
    }

    await this.prisma.vaultEntry.delete({
      where: { id },
    });

    return { message: 'Vault entry deleted successfully' };
  }

  async getCategoryCounts(userId: string) {
    const counts = await this.prisma.vaultEntry.groupBy({
      by: ['category'],
      where: { userId },
      _count: {
        id: true,
      },
    });

    return counts.map((item) => ({
      category: item.category,
      count: item._count.id,
    }));
  }

  /**
   * Get vault data with scoped access based on token's approved fields
   * GS-113: Parse and validate requested fields against token scopes
   * GS-114: Query vault_fields using IN with approved scope list
   * GS-115: Decrypt only requested allowed encrypted_value records
   * GS-120: Log vault access events with field tracking
   */
  async getScopedVaultData(
    userId: string,
    masterKey: string,
    approvedFields: string[],
    requestedFields?: string[],
    appId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Normalize approved fields to lowercase for matching
    const normalizedApproved = this.normalizeFields(approvedFields);

    // Determine which fields to return
    let fieldsToReturn = normalizedApproved;

    // If specific fields are requested, validate they are approved
    if (requestedFields && requestedFields.length > 0) {
      const normalizedRequested = this.normalizeFields(requestedFields);

      // Find intersection: only fields that are both requested AND approved
      fieldsToReturn = normalizedApproved.filter((field) =>
        normalizedRequested.includes(field),
      );

      // Validate all requested fields are approved
      const unapprovedFields = normalizedRequested.filter(
        (field) => !normalizedApproved.includes(field),
      );

      if (unapprovedFields.length > 0) {
        // Log failed access attempt
        await this.auditLogService.createAuditLog({
          userId,
          action: 'VAULT_READ',
          resourceType: 'VAULT_FIELDS',
          appId,
          approvedFields: normalizedApproved,
          requestedFields: normalizedRequested,
          accessedFields: [],
          ipAddress,
          userAgent,
          status: 'denied',
          details: `Requested unapproved fields: ${unapprovedFields.join(', ')}`,
        });

        throw new ForbiddenException(
          `Requested fields not approved: ${unapprovedFields.join(', ')}. Approved fields: ${normalizedApproved.join(', ')}`,
        );
      }
    }

    if (fieldsToReturn.length === 0) {
      return {
        userId,
        approvedFields: normalizedApproved,
        returnedFields: [],
        data: [],
      };
    }

    // Query vault fields that match the canonical scope list
    const vaultFields = await this.prisma.vaultField.findMany({
      where: {
        fieldKey: {
          in: fieldsToReturn,
        },
        vaultEntry: {
          userId,
        },
      },
      include: {
        vaultEntry: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            isFavorite: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Decrypt only the allowed fields
    const decryptedData = vaultFields.map((field) => ({
      fieldKey: field.fieldKey,
      value: this.encryptionService.decrypt(field.encryptedValue, masterKey),
      fieldType: field.fieldType,
      vaultEntry: field.vaultEntry,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    }));

    // Track which fields were actually accessed/returned
    const accessedFields = Array.from(
      new Set(decryptedData.map((d) => d.fieldKey)),
    );

    // Log successful access
    await this.auditLogService.createAuditLog({
      userId,
      action: 'VAULT_READ',
      resourceType: 'VAULT_FIELDS',
      appId,
      approvedFields: normalizedApproved,
      requestedFields: requestedFields
        ? this.normalizeFields(requestedFields)
        : normalizedApproved,
      accessedFields,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      userId,
      approvedFields: normalizedApproved,
      returnedFields: fieldsToReturn,
      data: decryptedData,
    };
  }

  private normalizeFields(fields: string[]): string[] {
    const normalized = fields
      .map((field) => field.trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(normalized)).sort();
  }

  private decryptVaultEntry(entry: any, masterKey: string) {
    return {
      ...entry,
      fields: entry.fields.map((field: any) => ({
        id: field.id,
        fieldKey: field.fieldKey,
        value: this.encryptionService.decrypt(field.encryptedValue, masterKey),
        fieldType: field.fieldType,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt,
      })),
    };
  }
}
