import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SlotsModule } from './slots/slots.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { EmergencyModule } from './emergency/emergency.module';
import { StrikesModule } from './strikes/strikes.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CronModule } from './cron/cron.module';
import { NotificationSettingsModule } from './notification-settings/notification-settings.module';
import { ProfessionalConfigModule } from './professional-config/professional-config.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    // Rate limiting - Disabled for development
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // No rate limiting in development
          ttl: 60000,
          limit: 10000,
        },
      ],
    }),
    AuthModule,
    SlotsModule,
    AppointmentsModule,
    EmergencyModule,
    StrikesModule,
    PaymentsModule,
    NotificationsModule,
    CronModule,
    NotificationSettingsModule,
    ProfessionalConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
