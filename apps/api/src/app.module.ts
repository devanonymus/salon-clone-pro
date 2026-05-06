import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { WhatsappModule } from "./whatsapp/whatsapp.module";
import { ClientsModule } from "./clients/clients.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { SalesModule } from "./sales/sales.module";
import { StaffModule } from "./staff/staff.module";
import { InventoryModule } from "./inventory/inventory.module";
import { ServicePricesModule } from "./service-prices/service-prices.module";
import { MarketingCardsModule } from "./marketing-cards/marketing-cards.module";

@Module({
  imports: [
    AuthModule,
    WhatsappModule,
    ClientsModule,
    AppointmentsModule,
    SalesModule,
    StaffModule,
    InventoryModule,
    ServicePricesModule,
    MarketingCardsModule,
  ],
})
export class AppModule {}
