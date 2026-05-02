import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { WhatsappModule } from "./whatsapp/whatsapp.module";
import { ClientsModule } from "./clients/clients.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { SalesModule } from "./sales/sales.module";

@Module({
  imports: [
    AuthModule,
    WhatsappModule,
    ClientsModule,
    AppointmentsModule,
    SalesModule,
  ],
})
export class AppModule {}
