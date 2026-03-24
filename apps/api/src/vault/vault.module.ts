import { Module } from '@nestjs/common';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';
import { KeyRotationService } from './services/key-rotation.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [UsersModule, AuthModule, CommonModule, PrismaModule, AuditModule],
  controllers: [VaultController],
  providers: [VaultService, KeyRotationService],
  exports: [VaultService, KeyRotationService],
})
export class VaultModule {}
