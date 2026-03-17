import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ConsentService } from './consent.service';
import { CreateConsentRequestDto } from './dto/create-consent-request.dto';
import { ApproveConsentRequestDto } from './dto/approve-consent-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from 'src/auth/decorators/current-user.decorator';

type ConsentRequestPayload = Prisma.ConsentRequestGetPayload<{
  select: {
    id: true;
    appId: true;
    redirectUri: true;
    requestedFields: true;
    expiresAt: true;
    status: true;
    state: true;
    createdAt: true;
  };
}>;

type ConsentAppPayload = Prisma.ThirdPartyAppGetPayload<{
  select: {
    id: true;
    name: true;
    clientId: true;
  };
}>;

@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Body() dto: CreateConsentRequestDto) {
    const result: {
      consentRequest: ConsentRequestPayload;
      app: ConsentAppPayload;
    } = await this.consentService.createConsentRequest(dto);
    const { consentRequest, app } = result;

    return {
      message: 'Consent request created successfully',
      data: {
        consentRequest,
        app: {
          id: app.id,
          name: app.name,
          clientId: app.clientId,
        },
      },
    };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async approveConsent(
    @Param('id') id: string,
    @Body() dto: ApproveConsentRequestDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.consentService.approveConsent(id, user.id, dto);

    return {
      message: 'Consent request approved successfully',
      data: result,
    };
  }

  @Post(':id/deny')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async denyConsent(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.consentService.denyConsent(id, user.id);

    return {
      message: 'Consent request denied successfully',
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getConsentDetail(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const consentRequest = await this.consentService.getConsentDetail(
      id,
      user.id,
    );

    return {
      data: consentRequest,
    };
  }
}

