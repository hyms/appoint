import { Injectable, Logger } from '@nestjs/common';
import { ProviderType } from '../dto/notification.dto';
import {
  INotificationProvider,
  SendResult,
} from '../interfaces/notification-provider.interface';
import { NotificationConfigService } from '../services/notification-config.service';

@Injectable()
export class WhatsAppProvider implements INotificationProvider {
  readonly type = ProviderType.WHATSAPP;
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(private configService: NotificationConfigService) {}

  isConfigured(): boolean {
    return this.configService.isWhatsAppConfigured();
  }

  async send(recipient: string, content: string): Promise<SendResult> {
    const config = this.configService.getWhatsAppConfig();

    if (!config) {
      this.logger.warn('WhatsApp credentials not configured. Simulating send.');
      return this.simulateSend(recipient, content);
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'text',
            text: { body: content },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      this.logger.error('WhatsApp send failed:', error);
      return { success: false, error: error.message };
    }
  }

  private simulateSend(recipient: string, message: string): SendResult {
    this.logger.log(
      `[WhatsApp] Simulated send to ${recipient}: ${message.substring(0, 50)}...`,
    );
    return { success: true, messageId: `whatsapp-simulated-${Date.now()}` };
  }
}
