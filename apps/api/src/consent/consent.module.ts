import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { TokenModule } from 'src/tokens/token.module';
import { AuditModule } from 'src/audit/audit.module';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';

@Module({
  imports: [PrismaModule, AuthModule, TokenModule, AuditModule],
  controllers: [ConsentController],
  providers: [ConsentService],
})
export class ConsentModule {}
