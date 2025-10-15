import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
interface JwtPayload {
  sub: number;
  email: string;
}
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwt: JwtService,
    private db: DatabaseService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ForbiddenException('Email already used');
    return await this.userService.createUser(dto.email, dto.password);
  }

  public async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user)
      throw new UnauthorizedException('Такої електронної адреси не існує');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Невірний пароль');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const tokenFromDb = await this.db.query(
        `SELECT * FROM user_tokens WHERE user_id = $1 AND refresh_token = $2 AND expires_at > NOW()`,
        [payload.sub, refreshToken],
      );

      if (!tokenFromDb.rows[0])
        throw new ForbiddenException('Invalid refresh token');

      // Генеруємо тільки новий access token
      const accessToken = await this.jwt.signAsync<JwtPayload>(
        { sub: payload.sub, email: payload.email },
        {
          secret: process.env.JWT_ACCESS_SECRET!,
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN! as any,
        },
      );

      return { accessToken, refreshToken }; // refreshToken залишаємо той самий
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: number, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync<JwtPayload>(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN! as any,
    });

    const refreshToken = await this.jwt.signAsync<JwtPayload>(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN! as any,
    });

    return { accessToken, refreshToken };
  }
  private async saveRefreshToken(userId: number, token: string) {
    await this.db.query(
      `INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [userId, token],
    );
  }
  async revokeRefreshToken(refreshToken: string) {
    await this.db.query(`DELETE FROM user_tokens WHERE refresh_token = $1`, [
      refreshToken,
    ]);
  }
}
