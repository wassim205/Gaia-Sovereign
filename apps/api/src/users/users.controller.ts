import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';

/**
 * GS-126: Active accesses endpoint
 */
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all active (non-revoked) access tokens for the logged-in user
   * Response includes app details, approved fields, expiry date
   */
  @Get('active-accesses')
  async getActiveAccesses(@CurrentUser() user: CurrentUserData) {
    const accesses = await this.usersService.getActiveAccesses(user.id);

    return {
      message: 'Active accesses retrieved successfully',
      data: accesses,
      count: accesses.length,
    };
  }
}
