import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './services/password.service';
import { CryptoService } from './services/crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private cryptoService: CryptoService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password using Argon2
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Generate master encryption key for user's vault
    const encryptedMasterKey = this.cryptoService.generateMasterKey();

    return this.usersService.create({
      username,
      email,
      password: hashedPassword,
      encryptedMasterKey,
    });
  }
}
