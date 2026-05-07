import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { StaffService } from "./staff.service";

@Controller("staff")
@UseGuards(JwtGuard)
export class StaffController {
  constructor(private service: StaffService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }



  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      role?: string;
      color?: string;
      monthlyCost?: number | string;
      productiveHours?: number | string;
      monthlyTarget?: number | string;
      active?: boolean;
    },
  ) {
    return this.service.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      role?: string;
      color?: string;
      monthlyCost?: number | string;
      productiveHours?: number | string;
      monthlyTarget?: number | string;
      active?: boolean;
    },
  ) {
    return this.service.update(req.user.tenantId, id, body);
  }
}