import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

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
      useFactory: (configService: ConfigService) => {
        const secret: string =
          configService.get<string>('JWT_SECRET') ?? 'your-secret-key';
        const expiresInValue: string =
          configService.get<string>('JWT_EXPIRES_IN') ?? '1d';
        return {
          secret,
          signOptions: {
            expiresIn: expiresInValue,
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
