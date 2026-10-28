import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PlatformService } from './platform.service';
import {
  checkOrigin,
  PlatformGuard,
  type PlatformRequest,
} from './platform.guard';
import {
  ActivateDto,
  ActiveDto,
  AdminDto,
  AssignmentDto,
  CheckDto,
  ConfigurationDto,
  EmailDto,
  InterventionDto,
  LoginDto,
  SalonDto,
  StatusDto,
} from './platform.dto';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/platform',
  maxAge: 8 * 3600000,
});
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly service: PlatformService) {}
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Req() req: Request,
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    checkOrigin(req);
    const token = await this.service.login(body);
    res.cookie('salonpro_platform', token, cookieOptions());
    res.setHeader('Cache-Control', 'no-store');
    return { ok: true };
  }
  @Post('recover')
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  recover(@Req() req: Request, @Body() body: EmailDto) {
    checkOrigin(req);
    return this.service.recover(body.email);
  }
  @Post('activate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  activate(@Req() req: Request, @Body() body: ActivateDto) {
    checkOrigin(req);
    return this.service.activate(body);
  }
}
@Controller('platform')
@UseGuards(PlatformGuard)
export class PlatformController {
  constructor(private readonly service: PlatformService) {}
  @Get('me') me(@Req() req: PlatformRequest) {
    return req.actor;
  }
  @Post('logout') async logout(
    @Req() req: PlatformRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.service.logout(req.actor, req.platformSessionId);
    res.clearCookie('salonpro_platform', cookieOptions());
    return { ok: true };
  }
  @Post('revoke-sessions') revoke(@Req() req: PlatformRequest) {
    return this.service.logout(req.actor, req.platformSessionId, true);
  }
  @Get('dashboard') dashboard(@Req() req: PlatformRequest) {
    return this.service.dashboard(req.actor);
  }
  @Get('salons') salons(@Req() req: PlatformRequest) {
    return this.service.list(req.actor);
  }
  @Post('salons') create(@Req() req: PlatformRequest, @Body() body: SalonDto) {
    return this.service.createSalon(req.actor, body);
  }
  @Get('salons/:id') detail(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
  ) {
    return this.service.detail(req.actor, id);
  }
  @Put('salons/:id') edit(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Body() body: SalonDto,
  ) {
    return this.service.editSalon(req.actor, id, body);
  }
  @Patch('salons/:id/status') status(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Body() body: StatusDto,
  ) {
    return this.service.status(req.actor, id, body);
  }
  @Post('salons/:id/assignments') assign(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Body() body: AssignmentDto,
  ) {
    return this.service.assign(req.actor, id, body.adminId);
  }
  @Delete('salons/:id/assignments/:adminId') unassign(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Param('adminId') adminId: string,
  ) {
    return this.service.assign(req.actor, id, adminId, true);
  }
  @Put('salons/:id/configurations/:section') config(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Param('section') section: string,
    @Body() body: ConfigurationDto,
  ) {
    return this.service.saveConfig(req.actor, id, section, body);
  }
  @Post('salons/:id/test/:section') test(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Param('section') section: string,
  ) {
    return this.service.testDevice(req.actor, id, section);
  }
  @Put('salons/:id/checks/:key') check(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Param('key') key: string,
    @Body() body: CheckDto,
  ) {
    return this.service.check(req.actor, id, key, body);
  }
  @Post('salons/:id/interventions') intervention(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Body() body: InterventionDto,
  ) {
    return this.service.intervention(req.actor, id, body.notes);
  }
  @Post('salons/:id/resend-invite') resendOwner(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
  ) {
    return this.service.resend(req.actor, id, 'owner');
  }
  @Post('technicians/:id/resend-invite') resendAdmin(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
  ) {
    return this.service.resend(req.actor, id, 'admin');
  }
  @Get('technicians') admins(@Req() req: PlatformRequest) {
    return this.service.admins(req.actor);
  }
  @Post('technicians') createAdmin(
    @Req() req: PlatformRequest,
    @Body() body: AdminDto,
  ) {
    return this.service.createAdmin(req.actor, body);
  }
  @Patch('technicians/:id') active(
    @Req() req: PlatformRequest,
    @Param('id') id: string,
    @Body() body: ActiveDto,
  ) {
    return this.service.activeAdmin(req.actor, id, body.active);
  }
}
