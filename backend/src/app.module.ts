import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { SlotsModule } from './slots/slots.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StrikesModule } from './strikes/strikes.module';
import { PaymentsModule } from './payments/payments.module';
import { EmergencyModule } from './emergency/emergency.module';
import { ProfessionalConfigModule } from './professional-config/professional-config.module';
import { NotificationSettingsModule } from './notification-settings/notification-settings.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 600000,
        limit: 100,
      },
    ]),
    AuthModule,
    AppointmentsModule,
    SlotsModule,
    NotificationsModule,
    StrikesModule,
    PaymentsModule,
    EmergencyModule,
    ProfessionalConfigModule,
    NotificationSettingsModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
