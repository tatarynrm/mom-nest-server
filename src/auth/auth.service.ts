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

  async register(email: string, password: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) throw new ForbiddenException('Email already used');
    return await this.userService.createUser(email, password);
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

      // Перевіряємо токен у базі
      const tokenFromDb = await this.db.query(
        `SELECT * FROM user_tokens WHERE user_id = $1 AND refresh_token = $2`,
        [payload.sub, refreshToken],
      );

      if (!tokenFromDb.rows[0])
        throw new ForbiddenException('Invalid refresh token');

      // Видаляємо старий refresh token
      await this.db.query(
        `DELETE FROM user_tokens WHERE user_id = $1 AND refresh_token = $2`,
        [payload.sub, refreshToken],
      );

      // Генеруємо нові токени
      const tokens = await this.generateTokens(payload.sub, payload.email);
      await this.saveRefreshToken(payload.sub, tokens.refreshToken);

      return tokens;
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
    await this.db.query(`DELETE FROM user_tokens WHERE user_id = $1`, [userId]);
    await this.db.query(
      `INSERT INTO user_tokens (user_id, refresh_token) VALUES ($1, $2)`,
      [userId, token],
    );
  }

  async revokeRefreshToken(refreshToken: string) {
    await this.db.query(`DELETE FROM user_tokens WHERE refresh_token = $1`, [
      refreshToken,
    ]);
  }
}
