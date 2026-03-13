import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { ThirdPartyAppsService } from './third-party-apps.service';
import { CreateThirdPartyAppDto } from './dto/create-third-party-app.dto';

@Controller('third-party-apps')
@UseGuards(JwtAuthGuard)
export class ThirdPartyAppsController {
  constructor(private readonly appsService: ThirdPartyAppsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateThirdPartyAppDto,
  ) {
    const { app, clientSecret } = await this.appsService.create(user.id, dto);

    // Important: return clientSecret only once (never store plaintext)
    return {
      message: 'Third-party app created successfully',
      data: {
        ...app,
        clientSecret,
      },
    };
  }
}
