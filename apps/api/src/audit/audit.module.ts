import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogService } from './services/audit-log.service';
import { AuditController } from './audit.controller';
import { AuditRetentionService } from './services/audit-retention.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditLogService, AuditRetentionService],
  exports: [AuditLogService, AuditRetentionService],
})
export class AuditModule {}
