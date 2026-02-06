import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationProvider } from './services/notification-provider.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationProvider, PrismaService],
  exports: [NotificationProvider],
})
export class NotificationsModule {}
