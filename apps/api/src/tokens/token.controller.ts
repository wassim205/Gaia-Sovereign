import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { RevokeTokenDto } from './dto/revoke-token.dto';

/**
 * GS-127: Token revocation endpoint
 */
@Controller('token')
@UseGuards(JwtAuthGuard)
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * Revoke an access token
   * GS-127: POST /api/token/revoke
   * GS-131: Log revocation in audit logs (when GS-13 is merged)
   */
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revokeToken(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RevokeTokenDto,
  ) {
    try {
      const revokedToken = await this.tokenService.revokeAccessTokenById(
        dto.tokenId,
        user.id,
      );

      return {
        message: 'Token revoked successfully',
        data: {
          id: revokedToken.id,
          appId: revokedToken.appId,
          revokedAt: revokedToken.revokedAt,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Unauthorized')) {
        throw new ForbiddenException('You can only revoke your own tokens');
      }

      if (errorMessage.includes('not found')) {
        throw new ForbiddenException('Token not found');
      }

      throw error;
    }
  }
}

