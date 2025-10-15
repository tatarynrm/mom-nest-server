import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);

    // Встановлюємо refresh token у cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS обов’язково
      sameSite: 'none', // для крос-домена

      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Повертаємо access token і, якщо хочеш, дані користувача
    return {
      accessToken: tokens.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    return req.user; // тут буде payload з JWT
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new ForbiddenException('Refresh token not found');

    const tokens = await this.authService.refresh(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS обов’язково
      sameSite: 'none', // для крос-домена

      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Видаляємо refresh token з БД
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Очищаємо cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Logged out successfully' };
  }
}
