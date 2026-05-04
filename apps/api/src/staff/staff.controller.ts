import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
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

  @Patch(":id")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      role?: string;
      color?: string;
      active?: boolean;
    },
  ) {
    return this.service.update(req.user.tenantId, id, body);
  }
}