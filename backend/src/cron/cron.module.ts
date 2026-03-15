import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './services/cron.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationSettingsModule } from '../notification-settings/notification-settings.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, NotificationSettingsModule, ConfigModule],
  providers: [CronService, PrismaService],
  exports: [CronService],
})
export class CronModule {}
