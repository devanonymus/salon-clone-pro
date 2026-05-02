import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('seed')
  seed() {
    return this.authService.seed();
  }

  @Post('login')
  login(
    @Body()
    body: {
      tenantCode: string;
      username: string;
      pin: string;
    },
  ) {
    return this.authService.login(
      body.tenantCode,
      body.username,
      body.pin,
    );
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}