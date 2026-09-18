import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  MoveAppointmentDto,
  UpdateAppointmentDto,
} from './appointments.dto';

@Controller('appointments')
@UseGuards(JwtGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  getAll(@Req() req: AuthRequest) {
    return this.appointmentsService.getAll(req.user.tenantId);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.tenantId, body);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(req.user.tenantId, id, body);
  }

  @Patch(':id/move')
  move(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: MoveAppointmentDto,
  ) {
    return this.appointmentsService.move(
      req.user.tenantId,
      id,
      body.date,
      body.staffId,
    );
  }

  @Delete(':id')
  delete(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.appointmentsService.delete(req.user.tenantId, id);
  }
}
