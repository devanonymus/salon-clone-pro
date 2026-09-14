import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, RolesGuard],
  exports: [JwtGuard, RolesGuard],
})
export class AuthModule {}
