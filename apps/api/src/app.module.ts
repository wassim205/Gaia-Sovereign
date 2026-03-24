import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CommonModule } from './common/common.module';
import { VaultModule } from './vault/vault.module';
import { ThirdPartyAppsModule } from './third-party-apps/third-party-apps.module';
import { ConsentModule } from './consent/consent.module';
import { TokenModule } from './tokens/token.module';
import { AuditModule } from './audit/audit.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    PrismaModule,
    VaultModule,
    ThirdPartyAppsModule,
    ConsentModule,
    TokenModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, RateLimitMiddleware, CsrfMiddleware)
      .forRoutes('*');
  }
}
