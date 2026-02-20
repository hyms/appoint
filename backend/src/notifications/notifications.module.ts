import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationProviderService } from './services/notification-provider.service';
import { NotificationConfigService } from './services/notification-config.service';
import { NotificationProviderRegistry } from './services/notification-provider.registry';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { EmailProvider } from './providers/email.provider';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    NotificationConfigService,
    NotificationProviderRegistry,
    WhatsAppProvider,
    TelegramProvider,
    EmailProvider,
    NotificationProviderService,
  ],
  exports: [NotificationProviderService],
})
export class NotificationsModule {
  constructor(
    private registry: NotificationProviderRegistry,
    private whatsapp: WhatsAppProvider,
    private telegram: TelegramProvider,
    private email: EmailProvider,
  ) {
    this.registry.register(whatsapp);
    this.registry.register(telegram);
    this.registry.register(email);
  }
}
