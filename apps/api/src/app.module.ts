import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { CoachModule } from './coach/coach.module';
import { DatabaseModule } from './database/database.module';
import { ClientAwardsModule } from './client-awards/client-awards.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { HealthController } from './health/health.controller';
import { InventoryModule } from './inventory/inventory.module';
import { MarketingCardsModule } from './marketing-cards/marketing-cards.module';
import { RequestIdMiddleware } from './observability/request-id.middleware';
import { HttpLoggingMiddleware } from './observability/http-logging.middleware';
import { SalesModule } from './sales/sales.module';
import { ServicePricesModule } from './service-prices/service-prices.module';
import { StaffModule } from './staff/staff.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    WhatsappModule,
    ClientsModule,
    AppointmentsModule,
    SalesModule,
    StaffModule,
    InventoryModule,
    ServicePricesModule,
    CoachModule,
    MarketingCardsModule,
    FiscalModule,
    ClientAwardsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, HttpLoggingMiddleware).forRoutes('*');
  }
}
