import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { ThirdPartyAppsController } from './third-party-apps.controller';
import { ThirdPartyAppsService } from './third-party-apps.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ThirdPartyAppsController],
  providers: [ThirdPartyAppsService],
  exports: [ThirdPartyAppsService],
})
export class ThirdPartyAppsModule {}
