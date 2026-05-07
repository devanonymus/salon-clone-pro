import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { CoachService } from "./coach.service";

@Controller("coach")
@UseGuards(JwtGuard)
export class CoachController {
  constructor(private readonly service: CoachService) {}

  @Get("settings")
  getSettings(@Req() req: any) {
    return this.service.getSettings(req.user.tenantId);
  }

  @Patch("settings")
  updateSettings(@Req() req: any, @Body() body: any) {
    return this.service.updateSettings(req.user.tenantId, body);
  }

  @Get("fixed-costs")
  listFixedCosts(@Req() req: any) {
    return this.service.listFixedCosts(req.user.tenantId);
  }

  @Post("fixed-costs")
  createFixedCost(@Req() req: any, @Body() body: { name?: string; amount?: number | string }) {
    return this.service.createFixedCost(req.user.tenantId, body);
  }

  @Patch("fixed-costs/:id")
  updateFixedCost(@Req() req: any, @Param("id") id: string, @Body() body: { name?: string; amount?: number | string }) {
    return this.service.updateFixedCost(req.user.tenantId, id, body);
  }

  @Delete("fixed-costs/:id")
  deleteFixedCost(@Req() req: any, @Param("id") id: string) {
    return this.service.deleteFixedCost(req.user.tenantId, id);
  }

  @Get("prebooking")
  listPrebooking(@Req() req: any, @Query("dateKey") dateKey?: string) {
    return this.service.listPrebooking(req.user.tenantId, dateKey);
  }

  @Patch("prebooking/:appointmentId")
  savePrebooking(
    @Req() req: any,
    @Param("appointmentId") appointmentId: string,
    @Body()
    body: {
      dateKey?: string;
      clientName?: string;
      clientPhone?: string;
      serviceName?: string;
      status?: string;
      note?: string;
    },
  ) {
    return this.service.savePrebooking(req.user.tenantId, appointmentId, body);
  }
}
