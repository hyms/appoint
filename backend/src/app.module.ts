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
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    // Rate limiting - Anti DDoS protection
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // General API rate limit: 1000 requests per minute (increased for development)
          ttl: 60000,
          limit: 1000,
        },
        {
          // Strict limit for auth endpoints: 20 requests per minute
          name: 'auth',
          ttl: 60000,
          limit: 20,
        },
        {
          // Very strict limit for magic-link: 10 requests per minute
          name: 'magic-link',
          ttl: 60000,
          limit: 10,
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
