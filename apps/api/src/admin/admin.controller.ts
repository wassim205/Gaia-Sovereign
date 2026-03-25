import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { AdminService } from './services/admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GS-163: List all users
  @Get('users')
  @HttpCode(HttpStatus.OK)
  async listUsers(
    @CurrentUser() user: CurrentUserData,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'suspended',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.adminService.listUsers(user.id, {
      search,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      message: 'Users retrieved successfully',
      data: result,
    };
  }

  // GS-164: List all third-party apps
  @Get('apps')
  @HttpCode(HttpStatus.OK)
  async listApps(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: 'ACTIVE' | 'BLOCKED',
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.adminService.listApps(user.id, {
      status,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      message: 'Apps retrieved successfully',
      data: result,
    };
  }

  // GS-172: Get detailed app information
  @Get('apps/:id')
  @HttpCode(HttpStatus.OK)
  async getAppDetails(
    @CurrentUser() user: CurrentUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const app = await this.adminService.getAppDetails(user.id, id);

    if (!app) {
      return { message: 'App not found', data: null };
    }

    return {
      message: 'App details retrieved successfully',
      data: app,
    };
  }

  // GS-165: Update app status (approve/block)
  @Patch('apps/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateAppStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status: 'ACTIVE' | 'BLOCKED' },
  ) {
    const app = await this.adminService.updateAppStatus(
      user.id,
      id,
      body.status,
    );

    return {
      message: `App status updated to ${body.status}`,
      data: app,
    };
  }

  // GS-168: Update user status (suspend/activate)
  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { action: 'suspend' | 'activate' },
  ) {
    const updatedUser = await this.adminService.updateUserStatus(
      user.id,
      id,
      body.action,
    );

    return {
      message: `User ${body.action}ed successfully`,
      data: updatedUser,
    };
  }

  // GS-167: Get audit logs
  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(
    @CurrentUser() user: CurrentUserData,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.adminService.getAuditLogs(user.id, {
      action,
      resourceType,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      message: 'Audit logs retrieved successfully',
      data: result,
    };
  }

  // GS-169: Get dashboard statistics
  @Get('dashboard/stats')
  @HttpCode(HttpStatus.OK)
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();

    return {
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    };
  }

  // GS-166: Get system health
  @Get('system/health')
  @HttpCode(HttpStatus.OK)
  getSystemHealth() {
    const health = this.adminService.getSystemHealth();

    return {
      message: 'System health retrieved successfully',
      data: health,
    };
  }
}
