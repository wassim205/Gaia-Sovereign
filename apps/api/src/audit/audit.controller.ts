import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { AuditLogService } from './services/audit-log.service';

/**
 * GS-122: Audit logs endpoint
 * GET /api/audit/logs?user_id=&from=&to=&app=&field=
 */
@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Get audit logs with optional filtering
   * Query parameters:
   * - from: ISO datetime string for start range
   * - to: ISO datetime string for end range
   * - app: App ID to filter by
   * - field: Field name to filter by (checks accessedFields)
   * - action: Action type to filter by (e.g., VAULT_READ, CONSENT_APPROVE)
   * - status: Log status to filter by (success, error, archived)
   * - limit: Results per page (default 50, max 200)
   * - offset: Pagination offset (default 0)
   */
  @Get('logs')
  async getLogs(
    @CurrentUser() user: CurrentUserData,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('app') appId?: string,
    @Query('field') field?: string,
    @Query('action') action?: string,
    @Query('status') status?: string,
    @Query('limit', new ParseIntPipe({ optional: true }))
    limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true }))
    offset?: number,
  ) {
    // Parse date ranges
    let from: Date | undefined;
    let to: Date | undefined;

    if (fromStr) {
      from = new Date(fromStr);
      if (isNaN(from.getTime())) {
        throw new BadRequestException('Invalid "from" date format');
      }
    }

    if (toStr) {
      to = new Date(toStr);
      if (isNaN(to.getTime())) {
        throw new BadRequestException('Invalid "to" date format');
      }
    }

    // Validate limit
    if (limit && (limit < 1 || limit > 200)) {
      throw new BadRequestException('Limit must be between 1 and 200');
    }

    // Validate offset
    if (offset && offset < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    const result = await this.auditLogService.getAuditLogs(user.id, {
      userId: user.id,
      appId,
      action,
      field,
      status,
      from,
      to,
      limit: limit || 50,
      offset: offset || 0,
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
