import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

/**
 * GS-126: Active accesses endpoint
 */
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all active (non-revoked) access tokens for the logged-in user
   * Response includes app details, approved fields, expiry date
   */
  @Get('active-accesses')
  @ApiOperation({
    summary: 'Get active accesses',
    description:
      'Retrieve all active (non-revoked) access tokens and apps with access to user data',
  })
  @ApiResponse({
    status: 200,
    description: 'Active accesses retrieved successfully',
    schema: {
      example: {
        message: 'Active accesses retrieved successfully',
        data: [
          {
            id: 'token-id',
            appId: 'app-id',
            appName: 'ShopNow',
            appStatus: 'ACTIVE',
            approvedFields: ['name', 'email'],
            expiresAt: '2026-12-26T10:00:00Z',
            createdAt: '2026-03-26T10:00:00Z',
            isExpired: false,
          },
        ],
        count: 1,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  async getActiveAccesses(@CurrentUser() user: CurrentUserData) {
    const accesses = await this.usersService.getActiveAccesses(user.id);

    return {
      message: 'Active accesses retrieved successfully',
      data: accesses,
      count: accesses.length,
    };
  }
}
