import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import type { AuthRequest } from '../auth/auth-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

@Controller('staff')
@UseGuards(JwtGuard, RolesGuard)
export class StaffController {
  constructor(private service: StaffService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.service.list(req.user.tenantId);
  }

  @Post()
  @Roles('OWNER', 'MANAGER')
  create(@Req() req: AuthRequest, @Body() body: CreateStaffDto) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateStaffDto,
  ) {
    return this.service.update(req.user.tenantId, id, body);
  }
}
