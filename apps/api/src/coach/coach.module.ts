import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CoachController } from "./coach.controller";
import { CoachService } from "./coach.service";

@Module({
  controllers: [CoachController],
  providers: [CoachService, PrismaService],
})
export class CoachModule {}
