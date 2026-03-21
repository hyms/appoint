import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationProviderService } from './services/notification-provider.service';
import { NotificationConfigService } from './services/notification-config.service';
import { NotificationProviderRegistry } from './services/notification-provider.registry';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { EmailProvider } from './providers/email.provider';
import { PrismaService } from '../prisma/prisma.service';
import { OneSignalService } from './onesignal.service';
import { OneSignalProvider } from './providers/onesignal.provider';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    NotificationConfigService,
    NotificationProviderRegistry,
    WhatsAppProvider,
    TelegramProvider,
    EmailProvider,
    NotificationProviderService,
    OneSignalService,
    OneSignalProvider,
  ],
  exports: [NotificationProviderService, OneSignalService],
})
export class NotificationsModule {
  constructor(
    private registry: NotificationProviderRegistry,
    private whatsapp: WhatsAppProvider,
    private telegram: TelegramProvider,
    private email: EmailProvider,
    private oneSignal: OneSignalProvider,
  ) {
    this.registry.register(whatsapp);
    this.registry.register(telegram);
    this.registry.register(email);
    this.registry.register(oneSignal);
  }
}
