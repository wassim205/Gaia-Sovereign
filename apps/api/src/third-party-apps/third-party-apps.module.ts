import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuditModule } from 'src/audit/audit.module';
import { ThirdPartyAppsController } from './third-party-apps.controller';
import { ThirdPartyAppsService } from './third-party-apps.service';
import { AppOwnerOrAdminGuard } from './guards/app-owner-or-admin.guard';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, AuditModule],
  controllers: [ThirdPartyAppsController],
  providers: [ThirdPartyAppsService, AppOwnerOrAdminGuard],
  exports: [ThirdPartyAppsService],
})
export class ThirdPartyAppsModule {}
