import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PasswordService } from './services/password.service';
import { CryptoService } from './services/crypto.service';

@Module({
  imports: [UsersModule],
  providers: [AuthService, PasswordService, CryptoService],
  controllers: [AuthController],
  exports: [PasswordService, CryptoService],
})
export class AuthModule {}
