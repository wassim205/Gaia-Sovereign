import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/auth/decorators/current-user.decorator';
import { ThirdPartyAppsService } from './third-party-apps.service';
import { AppOwnerOrAdminGuard } from './guards/app-owner-or-admin.guard';
import { CreateThirdPartyAppDto } from './dto/create-third-party-app.dto';
import { UpdateThirdPartyAppDto } from './dto/update-third-party-app.dto';
import { ChangeAppStatusDto } from './dto/change-app-status.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

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

  @Get()
  async findAll(@CurrentUser() user: CurrentUserData) {
    const apps = await this.appsService.findAll(user.id);

    return {
      message: 'Third-party apps retrieved successfully',
      data: apps,
    };
  }

  @Patch(':id/rotate-secret')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppOwnerOrAdminGuard)
  async rotateSecret(
    @CurrentUser() user: CurrentUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const { app, clientSecret } = await this.appsService.rotateSecret(
      id,
      user.id,
    );

    return {
      message: 'Client secret rotated successfully',
      data: {
        ...app,
        clientSecret,
      },
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppOwnerOrAdminGuard)
  async changeStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ChangeAppStatusDto,
  ) {
    const app = await this.appsService.changeStatus(id, user.id, body.status);

    return {
      message: `App status changed to ${body.status} successfully`,
      data: app,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AppOwnerOrAdminGuard)
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateThirdPartyAppDto,
  ) {
    const app = await this.appsService.update(id, user.id, dto);

    return {
      message: 'Third-party app updated successfully',
      data: app,
    };
  }

  @Get('getAllApps')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  async getAllApps() {
    const apps = await this.appsService.getAllApps();

    return {
      data: apps,
    };
  }
}
