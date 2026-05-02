import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from './jwt.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtGuard],
})
export class AuthModule {}
