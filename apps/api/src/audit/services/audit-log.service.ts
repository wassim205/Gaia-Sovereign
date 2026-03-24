import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  appId?: string;
  approvedFields?: string[];
  requestedFields?: string[];
  accessedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  details?: string;
}

export interface AuditLogFilters {
  userId?: string;
  appId?: string;
  action?: string;
  resourceType?: string;
  from?: Date;
  to?: Date;
  field?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   * GS-120: Log vault data access with field tracking
   * GS-121: Log consent actions (approve/deny/revoke)
   */
  async createAuditLog(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        action: dto.action,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId || null,
        appId: dto.appId || null,
        approvedFields: dto.approvedFields || [],
        requestedFields: dto.requestedFields || [],
        accessedFields: dto.accessedFields || [],
        ipAddress: dto.ipAddress || null,
        userAgent: dto.userAgent || null,
        status: dto.status || 'success',
        details: dto.details || null,
      },
    });
  }

  /**
   * Get audit logs with filtering
   * GS-122: Implement audit logs endpoint with filters
   */
  async getAuditLogs(userId: string, filters: AuditLogFilters) {
    const where: Prisma.AuditLogWhereInput = {
      userId,
    };

    // Filter by app if provided
    if (filters.appId) {
      where.appId = filters.appId;
    }

    // Filter by action if provided
    if (filters.action) {
      where.action = filters.action;
    }

    // Filter by resource type if provided
    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    // Filter by status if provided
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by date range
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters.from) {
      dateFilter.gte = filters.from;
    }
    if (filters.to) {
      dateFilter.lte = filters.to;
    }
    if (Object.keys(dateFilter).length > 0) {
      where.timestamp = dateFilter;
    }

    // Get total count
    const total = await this.prisma.auditLog.count({ where });

    // Get logs with pagination
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        appId: true,
        approvedFields: true,
        requestedFields: true,
        accessedFields: true,
        ipAddress: true,
        userAgent: true,
        status: true,
        details: true,
        timestamp: true,
        app: {
          select: {
            id: true,
            name: true,
            clientId: true,
          },
        },
      },
    });

    // Filter by field if provided (check accessedFields array)
    let filtered = logs;
    if (filters.field) {
      const normalizedField = filters.field.toLowerCase().trim();
      filtered = logs.filter((log) =>
        log.accessedFields.some(
          (field) => field.toLowerCase() === normalizedField,
        ),
      );
    }

    return {
      data: filtered,
      meta: {
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    };
  }

  /**
   * Delete audit logs older than specified date
   * GS-123: Implement retention policy
   */
  async deleteOlderThan(beforeDate: Date): Promise<{ count: number }> {
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: beforeDate,
        },
      },
    });

    return {
      count: result.count,
    };
  }

  /**
   * Archive audit logs (set status to archived instead of deleting)
   * GS-123: Alternative to deletion for compliance
   */
  async archiveOlderThan(beforeDate: Date): Promise<{ count: number }> {
    const result = await this.prisma.auditLog.updateMany({
      where: {
        timestamp: {
          lt: beforeDate,
        },
        status: {
          not: 'archived',
        },
      },
      data: {
        status: 'archived',
      },
    });

    return {
      count: result.count,
    };
  }

  /**
   * Get audit statistics for a user
   */
  async getAuditStats(userId: string, days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const stats = await this.prisma.auditLog.groupBy({
      by: ['action', 'resourceType'],
      where: {
        userId,
        timestamp: {
          gte: fromDate,
        },
      },
      _count: {
        id: true,
      },
    });

    return stats.map((item) => ({
      action: item.action,
      resourceType: item.resourceType,
      count: item._count.id,
    }));
  }
}
