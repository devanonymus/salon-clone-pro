import { Module } from "@nestjs/common";
import { CoachController } from "./coach.controller";
import { CoachService } from "./coach.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [CoachController],
  providers: [CoachService, PrismaService],
})
export class CoachModule {}
