import { Module } from "@nestjs/common";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { PrismaService } from "../prisma.service";
import { JwtGuard } from "../auth/jwt.guard";

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService, JwtGuard],
})
export class AppointmentsModule {}
