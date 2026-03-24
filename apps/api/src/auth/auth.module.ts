import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PasswordService } from './services/password.service';
import { CryptoService } from './services/crypto.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret: string =
          configService.get<string>('JWT_SECRET') ?? 'your-secret-key';
        const expiresIn: StringValue = (configService.get<string>(
          'JWT_EXPIRES_IN',
        ) ?? '1d') as StringValue;
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  providers: [AuthService, PasswordService, CryptoService, JwtStrategy],
  controllers: [AuthController],
  exports: [PasswordService, CryptoService, JwtStrategy],
})
export class AuthModule {}
