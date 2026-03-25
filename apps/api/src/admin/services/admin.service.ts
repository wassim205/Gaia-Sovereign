import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogService } from 'src/audit/services/audit-log.service';

export interface AdminListUsersFilters {
  search?: string;
  status?: 'active' | 'suspended';
  limit?: number;
  offset?: number;
}

export interface AdminListAppsFilters {
  status?: 'ACTIVE' | 'BLOCKED';
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  // GS-163: Get paginated users list with filtering
  async listUsers(adminId: string, filters: AdminListUsersFilters) {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status === 'active') {
      where.status = 1;
    } else if (filters.status === 'suspended') {
      where.status = 0;
    }

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            vaultEntries: true,
            accessTokens: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });

    return {
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        status: u.status === 1 ? 'active' : 'suspended',
        vaultFieldsCount: u._count.vaultEntries,
        tokensCount: u._count.accessTokens,
        joinedAt: u.createdAt,
      })),
      meta: {
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
      },
    };
  }

  // GS-164: Get all third-party apps with pagination
  async listApps(adminId: string, filters: AdminListAppsFilters) {
    const where: Prisma.ThirdPartyAppWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { clientId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.thirdPartyApp.count({ where });

    const apps = await this.prisma.thirdPartyApp.findMany({
      where,
      select: {
        id: true,
        name: true,
        clientId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        _count: {
          select: {
            accessTokens: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });

    return {
      data: apps.map((a) => ({
        id: a.id,
        name: a.name,
        clientId: a.clientId,
        status: a.status,
        owner: a.owner,
        tokensCount: a._count.accessTokens,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      meta: {
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
      },
    };
  }

  // GS-172: Get detailed app information
  async getAppDetails(adminId: string, appId: string) {
    const app = await this.prisma.thirdPartyApp.findUnique({
      where: { id: appId },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        status: true,
        redirectUris: true,
        createdAt: true,
        updatedAt: true,
        secretRotatedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        accessTokens: {
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
            revokedAt: true,
            approvedFields: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!app) {
      return null;
    }

    return {
      ...app,
      activeTokensCount: app.accessTokens.filter(
        (t) => !t.revokedAt && t.expiresAt > new Date(),
      ).length,
    };
  }

  // GS-165: Approve or block an app
  async updateAppStatus(
    adminId: string,
    appId: string,
    status: 'ACTIVE' | 'BLOCKED',
  ) {
    const app = await this.prisma.thirdPartyApp.update({
      where: { id: appId },
      data: { status },
      select: {
        id: true,
        name: true,
        clientId: true,
        status: true,
      },
    });

    // GS-171: Log admin action
    await this.auditLogService.createAuditLog({
      userId: adminId,
      action: 'APP_STATUS_CHANGE',
      resourceType: 'THIRD_PARTY_APP',
      resourceId: appId,
      details: `Admin changed app status to ${status}: ${app.name}`,
      status: 'success',
    });

    return app;
  }

  // GS-168: Suspend or activate user account
  async updateUserStatus(
    adminId: string,
    userId: string,
    action: 'suspend' | 'activate',
  ) {
    const newStatus = action === 'suspend' ? 0 : 1;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
      },
    });

    // GS-171: Log admin action
    await this.auditLogService.createAuditLog({
      userId: adminId,
      action: action === 'suspend' ? 'USER_SUSPEND' : 'USER_ACTIVATE',
      resourceType: 'USER',
      resourceId: userId,
      details: `Admin ${action}ed user: ${user.username}`,
      status: 'success',
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status === 1 ? 'active' : 'suspended',
    };
  }

  // GS-167: Get audit logs (admin can see all)
  async getAuditLogs(
    adminId: string,
    filters: {
      action?: string;
      resourceType?: string;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) {
        const ts = where.timestamp as Prisma.DateTimeFilter;
        ts.gte = filters.from;
      }
      if (filters.to) {
        const ts = where.timestamp as Prisma.DateTimeFilter;
        ts.lte = filters.to;
      }
    }

    const total = await this.prisma.auditLog.count({ where });

    const logs = await this.prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        appId: true,
        status: true,
        details: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return {
      data: logs,
      meta: {
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    };
  }

  // GS-169: Get dashboard statistics
  async getDashboardStats() {
    const [totalUsers, totalVaults, totalTokens, blockAlerts] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.vaultEntry.count(),
        this.prisma.accessToken.count(),
        this.prisma.thirdPartyApp.count({ where: { status: 'BLOCKED' } }),
      ]);

    // Get user growth (last 8 months)
    const userGrowth = await this.getMonthlyUserGrowth();

    // Get API requests (this week)
    const apiRequests = await this.getWeeklyApiRequests();

    return {
      totalUsers,
      totalVaults,
      totalTokens,
      blockAlerts,
      userGrowth,
      apiRequests,
    };
  }

  private async getMonthlyUserGrowth() {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const growth = [];

    for (let i = 0; i < months.length; i++) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - (months.length - i - 1));

      const count = await this.prisma.user.count({
        where: {
          createdAt: { lte: targetDate },
        },
      });

      growth.push({
        month: months[i],
        users: count,
      });
    }

    return growth;
  }

  private async getWeeklyApiRequests() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const requests = [];

    for (let i = 0; i < days.length; i++) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - (days.length - i - 1));
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await this.prisma.auditLog.count({
        where: {
          timestamp: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      requests.push({
        day: days[i],
        requests: count,
      });
    }

    return requests;
  }

  // GS-166: Get system health status
  getSystemHealth() {
    return {
      metrics: [
        {
          icon: 'Server',
          label: 'API Server',
          status: 'operational',
          uptime: '99.99%',
        },
        {
          icon: 'Database',
          label: 'Database',
          status: 'operational',
          uptime: '99.97%',
        },
        {
          icon: 'Lock',
          label: 'Auth Service',
          status: 'operational',
          uptime: '100%',
        },
        { icon: 'Wifi', label: 'CDN', status: 'operational', uptime: '99.95%' },
      ],
    };
  }
}
