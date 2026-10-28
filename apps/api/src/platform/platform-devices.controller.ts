import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformGuard, type PlatformRequest } from './platform.guard';
import { PlatformDevicesService } from './platform-devices.service';
import {
  DeviceDto,
  DeviceUpdateDto,
  DeviceVersionDto,
  DeviceCheckDto,
} from './platform.dto';
@Controller('platform/salons/:tenantId')
@UseGuards(PlatformGuard)
export class PlatformDevicesController {
  constructor(private readonly devices: PlatformDevicesService) {}
  @Get('devices/section/:section') list(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('section') section: string,
  ) {
    return this.devices.list(req.actor, tenant, section);
  }
  @Post('devices/section/:section') create(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('section') section: string,
    @Body() body: DeviceDto,
  ) {
    return this.devices.create(req.actor, tenant, section, body);
  }
  @Post('devices/import/:section') import(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('section') section: string,
    @Body() body: DeviceDto,
  ) {
    return this.devices.create(req.actor, tenant, section, body, true);
  }
  @Put('devices/:deviceId') update(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('deviceId') id: string,
    @Body() body: DeviceUpdateDto,
  ) {
    return this.devices.update(req.actor, tenant, id, body);
  }
  @Post('devices/:deviceId/archive') archive(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('deviceId') id: string,
    @Body() body: DeviceVersionDto,
  ) {
    return this.devices.archive(req.actor, tenant, id, body.version);
  }
  @Post('devices/:deviceId/restore') restore(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('deviceId') id: string,
    @Body() body: DeviceVersionDto,
  ) {
    return this.devices.archive(req.actor, tenant, id, body.version, true);
  }
  @Post('devices/:deviceId/check') check(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('deviceId') id: string,
    @Body() body: DeviceCheckDto,
  ) {
    return this.devices.check(req.actor, tenant, id, body);
  }
  @Post('devices/:deviceId/test') test(
    @Req() req: PlatformRequest,
    @Param('tenantId') tenant: string,
    @Param('deviceId') id: string,
  ) {
    return this.devices.test(req.actor, tenant, id);
  }
}
