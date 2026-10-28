import { PlatformDevicesController } from './platform-devices.controller';
import { PlatformDevicesService } from './platform-devices.service';
import { CoachModule } from '../coach/coach.module';
import { Module } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformGuard } from './platform.guard';
import {
  PlatformAuthController,
  PlatformController,
} from './platform.controller';
@Module({
  imports: [CoachModule],
  controllers: [
    PlatformController,
    PlatformAuthController,
    PlatformDevicesController,
  ],
  providers: [PlatformService, PlatformGuard, PlatformDevicesService],
})
export class PlatformModule {}
