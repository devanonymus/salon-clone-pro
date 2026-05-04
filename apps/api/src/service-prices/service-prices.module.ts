import { Module } from "@nestjs/common";
import { ServicePricesController } from "./service-prices.controller";
import { ServicePricesService } from "./service-prices.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [ServicePricesController],
  providers: [ServicePricesService, PrismaService],
  exports: [ServicePricesService],
})
export class ServicePricesModule {}