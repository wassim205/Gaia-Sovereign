import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { AuditLogService } from './services/audit-log.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  // Get audit logs with optional filtering
  @Get('logs')
  async getLogs(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryAuditLogsDto,
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    const result = await this.auditLogService.getAuditLogs(user.id, {
      userId: user.id,
      appId: query.app,
      action: query.action,
      field: query.field,
      status: query.status,
      from,
      to,
      limit: query.limit || 50,
      offset: query.offset || 0,
    });

    return {
      message: 'Audit logs retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * Get audit statistics for the current user (last 30 days by default)
   */
  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserData) {
    const stats = await this.auditLogService.getAuditStats(user.id, 30);
    return {
      message: 'Audit statistics retrieved successfully',
      data: stats,
      period: '30 days',
    };
  }
}
