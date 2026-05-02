import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { StaffService } from "./staff.service";

@Controller("staff")
export class StaffController {
  constructor(private service: StaffService) {}

  @UseGuards(JwtGuard)
  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }
}