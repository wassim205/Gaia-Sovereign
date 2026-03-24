import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const csrfToken = randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite =
      (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax';

    res.cookie(process.env.CSRF_COOKIE_NAME || 'csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.COOKIE_SECURE === 'true' || isProduction,
      sameSite,
      path: '/',
      maxAge: 60 * 60 * 1000,
    });

    return {
      message: 'CSRF token generated successfully',
      data: { csrfToken },
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);

    return {
      message: 'User registered successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return {
      message: 'Login successful',
      data: result,
    };
  }
}
