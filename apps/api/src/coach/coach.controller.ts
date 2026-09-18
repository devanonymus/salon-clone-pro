import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CoachService } from './coach.service';
import {
  CreateFixedCostDto,
  ListPrebookingQueryDto,
  SavePrebookingDto,
  UpdateCoachSettingsDto,
  UpdateFixedCostDto,
} from './coach.dto';

@Controller('coach')
@UseGuards(JwtGuard, RolesGuard)
export class CoachController {
  constructor(private readonly service: CoachService) {}

  @Get('settings')
  getSettings(@Req() req: AuthRequest) {
    return this.service.getSettings(req.user.tenantId);
  }

  @Patch('settings')
  @Roles('OWNER', 'MANAGER')
  updateSettings(
    @Req() req: AuthRequest,
    @Body() body: UpdateCoachSettingsDto,
  ) {
    return this.service.updateSettings(req.user.tenantId, body);
  }

  @Get('fixed-costs')
  listFixedCosts(@Req() req: AuthRequest) {
    return this.service.listFixedCosts(req.user.tenantId);
  }

  @Post('fixed-costs')
  @Roles('OWNER', 'MANAGER')
  createFixedCost(@Req() req: AuthRequest, @Body() body: CreateFixedCostDto) {
    return this.service.createFixedCost(req.user.tenantId, body);
  }

  @Patch('fixed-costs/:id')
  @Roles('OWNER', 'MANAGER')
  updateFixedCost(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateFixedCostDto,
  ) {
    return this.service.updateFixedCost(req.user.tenantId, id, body);
  }

  @Delete('fixed-costs/:id')
  @Roles('OWNER', 'MANAGER')
  deleteFixedCost(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.deleteFixedCost(req.user.tenantId, id);
  }

  @Get('prebooking')
  listPrebooking(
    @Req() req: AuthRequest,
    @Query() query: ListPrebookingQueryDto,
  ) {
    return this.service.listPrebooking(req.user.tenantId, query.dateKey);
  }

  @Patch('prebooking/:appointmentId')
  savePrebooking(
    @Req() req: AuthRequest,
    @Param('appointmentId') appointmentId: string,
    @Body() body: SavePrebookingDto,
  ) {
    return this.service.savePrebooking(req.user.tenantId, appointmentId, body);
  }
}
