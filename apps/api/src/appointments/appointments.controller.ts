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
  BadRequestException,
} from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { AppointmentsService } from "./appointments.service";

@Controller("appointments")
@UseGuards(JwtGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  getAll(@Req() req: any) {
    return this.appointmentsService.getAll(req.user.tenantId);
  }

  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      clientTenantId?: string;
      date?: string;
      services?: string[];
    },
  ) {
    if (!body.clientTenantId) {
      throw new BadRequestException("Cliente mancante");
    }

    if (!body.date) {
      throw new BadRequestException("Data mancante");
    }

    if (!body.services || body.services.length === 0) {
      throw new BadRequestException("Trattamenti mancanti");
    }

    return this.appointmentsService.create(req.user.tenantId, {
      clientTenantId: body.clientTenantId,
      date: body.date,
      services: body.services,
    });
  }

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      clientTenantId?: string;
      date?: string;
      services?: string[];
    },
  ) {
    return this.appointmentsService.update(req.user.tenantId, id, body);
  }

  @Patch(":id/move")
  move(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { date?: string },
  ) {
    if (!body.date) {
      throw new BadRequestException("Data mancante");
    }

    return this.appointmentsService.move(req.user.tenantId, id, body.date);
  }

  @Delete(":id")
  delete(@Req() req: any, @Param("id") id: string) {
    return this.appointmentsService.delete(req.user.tenantId, id);
  }
}