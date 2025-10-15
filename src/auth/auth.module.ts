/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseService } from '../database/database.service';
import { UserService } from '../user/user.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  imports: [JwtModule.register({}),DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, DatabaseService, UserService],
})
export class AuthModule {}
