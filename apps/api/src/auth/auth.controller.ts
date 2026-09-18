import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import type { AuthRequest } from './auth-request';
import { ChangePinDto, CreateSalonDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('seed')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  seed() {
    return this.authService.seed();
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.tenantCode, body.username, body.pin);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER')
  @Post('salons')
  createSalon(@Req() req: AuthRequest, @Body() body: CreateSalonDto) {
    return this.authService.createSalon(req.user, body);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return req.user;
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('OWNER')
  @Patch('me/pin')
  changePin(@Req() req: AuthRequest, @Body() body: ChangePinDto) {
    return this.authService.changePin(req.user, body.pin);
  }
}
